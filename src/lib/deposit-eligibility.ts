import { queryOne } from "./db";
import { MINIMUM_DEPOSIT_CENTS } from "./flags";

export type DepositEligibility = {
  creditedCents: number;
  thresholdCents: number;
  remainingCents: number;
  eligible: boolean;
};

/** A pending order never unlocks account features; only ledger-verified credits count. */
export async function getDepositEligibility(userId: string): Promise<DepositEligibility> {
  const row = await queryOne<{ total: number | null }>(
    "SELECT COALESCE(SUM(amount_cents), 0) AS total FROM deposit_orders WHERE user_id = ? AND status = 'credited'",
    [userId],
  );
  const creditedCents = Number(row?.total ?? 0);
  const thresholdCents = MINIMUM_DEPOSIT_CENTS;

  return {
    creditedCents,
    thresholdCents,
    remainingCents: Math.max(0, thresholdCents - creditedCents),
    eligible: creditedCents >= thresholdCents,
  };
}
