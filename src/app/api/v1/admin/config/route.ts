import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { setConfigValue, setFeatureFlag, getBep20Address, getDepositMinCents, getDepositMaxCents, getWithdrawalFeeBps, isFeatureEnabled, type FeatureFlag } from "@/lib/flags";
import { audit } from "@/lib/audit";

const ALLOWED_VALUE_KEYS = new Set(["bep20_deposit_address", "deposit_min_cents", "deposit_max_cents", "withdrawal_fee_bps"]);
const ALLOWED_FLAGS = new Set<FeatureFlag>(["deposits_enabled", "withdrawals_enabled", "referrals_enabled", "investments_enabled"]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  return NextResponse.json({
    bep20Address: await getBep20Address(),
    depositMinCents: await getDepositMinCents(),
    depositMaxCents: await getDepositMaxCents(),
    withdrawalFeeBps: await getWithdrawalFeeBps(),
    flags: {
      deposits: await isFeatureEnabled("deposits_enabled"),
      withdrawals: await isFeatureEnabled("withdrawals_enabled"),
      referrals: await isFeatureEnabled("referrals_enabled"),
      investments: await isFeatureEnabled("investments_enabled"),
    },
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

  if (ALLOWED_VALUE_KEYS.has(key)) {
    const str = String(value ?? "").trim();
    if (key === "bep20_deposit_address" && str && !/^0x[a-fA-F0-9]{40}$/.test(str)) {
      return NextResponse.json({ error: "BEP20 address must be a 0x-prefixed 40-hex-character address." }, { status: 400 });
    }
    if (key !== "bep20_deposit_address") {
      const n = Number(str);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Value must be a non-negative number." }, { status: 400 });
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
