import { queryOne, execute, nowIso } from "./db";

export type FeatureFlag =
  | "deposits_enabled"
  | "withdrawals_enabled"
  | "referrals_enabled"
  | "investments_enabled";

const FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  deposits_enabled: false,
  withdrawals_enabled: false,
  referrals_enabled: false,
  investments_enabled: false,
};

function liveModeEnv(): boolean {
  return process.env.SPL_LIVE_MODE === "1";
}

export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  if (!liveModeEnv()) return false;
  const row = await queryOne<{ value: string }>("SELECT value FROM platform_config WHERE key = ?", [flag]);
  if (!row) return FLAG_DEFAULTS[flag];
  try {
    return JSON.parse(row.value) === true;
  } catch {
    return FLAG_DEFAULTS[flag];
  }
}

export async function setFeatureFlag(flag: FeatureFlag, enabled: boolean): Promise<void> {
  await execute(
    `INSERT INTO platform_config (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [flag, JSON.stringify(enabled), nowIso()],
  );
}

export async function getConfigNumber(key: string, fallback: number): Promise<number> {
  const row = await queryOne<{ value: string }>("SELECT value FROM platform_config WHERE key = ?", [key]);
  if (!row) return fallback;
  const n = Number(row.value);
  return Number.isFinite(n) ? n : fallback;
}

export async function setConfigValue(key: string, value: string): Promise<void> {
  await execute(
    `INSERT INTO platform_config (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, nowIso()],
  );
}

export const DEPOSIT_MIN_CENTS_KEY = "deposit_min_cents";
export const DEPOSIT_MAX_CENTS_KEY = "deposit_max_cents";
export const WITHDRAWAL_FEE_BPS_KEY = "withdrawal_fee_bps";
export const BEP20_ADDRESS_KEY = "bep20_deposit_address";

export async function getDepositMinCents(): Promise<number> {
  return await getConfigNumber(DEPOSIT_MIN_CENTS_KEY, 500_00);
}

export async function getDepositMaxCents(): Promise<number> {
  return await getConfigNumber(DEPOSIT_MAX_CENTS_KEY, 100_000_00);
}

export async function getWithdrawalFeeBps(): Promise<number> {
  return await getConfigNumber(WITHDRAWAL_FEE_BPS_KEY, 100);
}

export async function getBep20Address(): Promise<string> {
  const row = await queryOne<{ value: string }>("SELECT value FROM platform_config WHERE key = ?", [BEP20_ADDRESS_KEY]);
  if (row?.value?.trim()) return row.value.trim();
  return (process.env.SPL_BEP20_ADDRESS ?? "").trim();
}
