import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { nowIso, runBatch } from "@/lib/db";
import {
  setConfigValue,
  setFeatureFlag,
  getBep20Address,
  getDepositMinCents,
  getDepositMaxCents,
  getWithdrawalFeeBps,
  getConfiguredFeatureFlag,
  isFeatureEnabled,
  MINIMUM_DEPOSIT_CENTS,
  DEPOSIT_MIN_CENTS_KEY,
  DEPOSIT_MAX_CENTS_KEY,
  type FeatureFlag,
} from "@/lib/flags";
import { audit } from "@/lib/audit";
import { getPaymentDestination } from "@/lib/payment-destination";

const ALLOWED_VALUE_KEYS = new Set(["bep20_deposit_address", "deposit_min_cents", "deposit_max_cents", "deposit_limits", "withdrawal_fee_bps"]);
const ALLOWED_FLAGS = new Set<FeatureFlag>(["deposits_enabled", "withdrawals_enabled", "referrals_enabled"]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const destination = await getPaymentDestination();
  return NextResponse.json({
    bep20Address: await getBep20Address(),
    depositQrDataUrl: destination.qrDataUrl,
    depositAddressValid: destination.configured,
    depositMinCents: await getDepositMinCents(),
    depositMaxCents: await getDepositMaxCents(),
    withdrawalFeeBps: await getWithdrawalFeeBps(),
    flags: {
      deposits: await isFeatureEnabled("deposits_enabled"),
      withdrawals: await isFeatureEnabled("withdrawals_enabled"),
      referrals: await isFeatureEnabled("referrals_enabled"),
      investments: false,
    },
    configuredFlags: {
      deposits: await getConfiguredFeatureFlag("deposits_enabled"),
      withdrawals: await getConfiguredFeatureFlag("withdrawals_enabled"),
      referrals: await getConfiguredFeatureFlag("referrals_enabled"),
      investments: await getConfiguredFeatureFlag("investments_enabled"),
    },
    featureUnlockMinCents: MINIMUM_DEPOSIT_CENTS,
    liveModeEnv: process.env.SPL_LIVE_MODE === "1",
  });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  let body: { key?: string; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { key, value } = body;
  if (!key) return NextResponse.json({ error: "key is required." }, { status: 400 });

  if (key === "deposit_limits") {
    const limits = value as { minCents?: unknown; maxCents?: unknown } | null;
    const minCents = Number(limits?.minCents);
    const maxCents = Number(limits?.maxCents);
    if (!Number.isInteger(minCents) || !Number.isInteger(maxCents)) {
      return NextResponse.json({ error: "Deposit limits must be integer cents." }, { status: 400 });
    }
    if (minCents < MINIMUM_DEPOSIT_CENTS) {
      return NextResponse.json({ error: "The minimum deposit cannot be set below $500.00." }, { status: 400 });
    }
    if (maxCents < minCents || maxCents <= 0) {
      return NextResponse.json({ error: "Maximum deposit must be at least the minimum deposit." }, { status: 400 });
    }
    const updatedAt = nowIso();
    await runBatch([
      {
        sql: "INSERT INTO platform_config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params: [DEPOSIT_MIN_CENTS_KEY, String(minCents), updatedAt],
      },
      {
        sql: "INSERT INTO platform_config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params: [DEPOSIT_MAX_CENTS_KEY, String(maxCents), updatedAt],
      },
    ]);
    await audit({
      actorId: auth.user.id,
      actorRole: "admin",
      action: "config.deposit_limits",
      targetType: "platform_config",
      targetId: "deposit_limits",
      metadata: { minCents, maxCents },
    });
    return NextResponse.json({ success: true });
  }

  if (ALLOWED_VALUE_KEYS.has(key)) {
    const str = String(value ?? "").trim();
    if (key === "bep20_deposit_address") {
      if (!/^0x[a-fA-F0-9]{40}$/.test(str)) {
        return NextResponse.json({ error: "BEP-20 address must be a 0x-prefixed 40-hex-character address." }, { status: 400 });
      }
    } else {
      const n = Number(str);
      if (!Number.isInteger(n) || n < 0) {
        return NextResponse.json({ error: "Value must be a non-negative integer." }, { status: 400 });
      }
      if (key === "deposit_min_cents") {
        if (n < MINIMUM_DEPOSIT_CENTS) {
          return NextResponse.json({ error: "The minimum deposit cannot be set below $500.00." }, { status: 400 });
        }
        if (n > await getDepositMaxCents()) {
          return NextResponse.json({ error: "Minimum deposit cannot exceed the configured maximum." }, { status: 400 });
        }
      }
      if (key === "deposit_max_cents" && n < await getDepositMinCents()) {
        return NextResponse.json({ error: "Maximum deposit cannot be below the $500.00 minimum." }, { status: 400 });
      }
      if (key === "withdrawal_fee_bps" && n >= 10_000) {
        return NextResponse.json({ error: "Withdrawal fee must be less than 100%." }, { status: 400 });
      }
    }
    await setConfigValue(key, str);
    await audit({ actorId: auth.user.id, actorRole: "admin", action: "config.set", targetType: "platform_config", targetId: key, metadata: { value: str } });
    return NextResponse.json({ success: true });
  }

  if (ALLOWED_FLAGS.has(key as FeatureFlag)) {
    const enabled = value === true || value === "true";
    await setFeatureFlag(key as FeatureFlag, enabled);
    await audit({ actorId: auth.user.id, actorRole: "admin", action: "config.flag", targetType: "platform_config", targetId: key, metadata: { enabled } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Key is not in the allowlist." }, { status: 400 });
}
