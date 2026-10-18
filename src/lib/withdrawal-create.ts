import { newId, nowIso, runBatch } from "./db";
import { entryStatements, transactionStatement, getUserCashBalanceCents } from "./ledger";
import { getWithdrawalFeeBps, isFeatureEnabled } from "./flags";
import { getDepositEligibility } from "./deposit-eligibility";
import { WithdrawalError, getWithdrawalById, type WithdrawalRequest } from "./withdrawal-view";

export const MIN_WITHDRAWAL_CENTS = 10_00;

const BALANCE_SQL = `SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount_cents ELSE -amount_cents END), 0)
                     FROM ledger_entries WHERE user_id = ? AND account = 'liability_user_cash'`;

export async function createWithdrawalRequest(input: {
  userId: string;
  amountCents: number;
  destinationType: string;
  destinationRef: string;
}): Promise<WithdrawalRequest> {
  if (!(await isFeatureEnabled("withdrawals_enabled"))) {
    throw new WithdrawalError("Payout requests are not enabled for this deployment.", "FEATURE_DISABLED", 403);
  }
  const eligibility = await getDepositEligibility(input.userId);
  if (!eligibility.eligible) {
    throw new WithdrawalError("A verified deposit of at least $500.00 is required before payout requests unlock.", "DEPOSIT_REQUIRED", 403);
  }
  if (input.destinationType !== "BEP20" || !/^0x[a-fA-F0-9]{40}$/.test(input.destinationRef)) {
    throw new WithdrawalError("Only valid BNB Smart Chain (BEP-20) destination addresses are supported.", "INVALID_DESTINATION", 400);
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new WithdrawalError("Payout amount must be positive integer cents.", "INVALID_AMOUNT", 400);
  }

  if (input.amountCents < MIN_WITHDRAWAL_CENTS) {
    throw new WithdrawalError(`Minimum withdrawal is $${(MIN_WITHDRAWAL_CENTS / 100).toFixed(2)}.`, "BELOW_MIN", 400);
  }

  const balance = await getUserCashBalanceCents(input.userId);
  if (input.amountCents > balance) {
    throw new WithdrawalError("Insufficient available balance.", "INSUFFICIENT_FUNDS", 400);
  }

  const feeBps = await getWithdrawalFeeBps();
  const feeCents = Math.ceil((input.amountCents * feeBps) / 10_000);
  const netCents = input.amountCents - feeCents;
  if (netCents <= 0) throw new WithdrawalError("Amount too small after fees.", "BELOW_MIN", 400);

  const id = newId();
  const now = nowIso();
  const ref = `WDR-${Date.now()}-${id.slice(0, 8).toUpperCase()}`;
  const holdTxnId = newId();

  // The insert re-evaluates the balance inside the same atomic batch as the
  // ledger hold, so two concurrent requests cannot both spend the same funds:
  // whichever batch runs second sees the first hold and inserts no row (the
  // hold is gated on the withdrawal row, so nothing partial is written).
  const [inserted] = await runBatch([
    {
      sql: `INSERT INTO withdrawal_requests (id, user_id, internal_ref, amount_cents, fee_cents, net_cents, currency, destination_type, destination_ref, status, created_at, updated_at)
            SELECT ?, ?, ?, ?, ?, ?, 'USD', ?, ?, 'pending', ?, ?
            WHERE (${BALANCE_SQL}) >= ?`,
      params: [
        id,
        input.userId,
        ref,
        input.amountCents,
        feeCents,
        netCents,
        input.destinationType,
        input.destinationRef,
        now,
        now,
        input.userId,
        input.amountCents,
      ],
    },
    transactionStatement(
      {
        id: holdTxnId,
        idempotencyKey: `withdrawal-hold-${id}`,
        type: "withdrawal",
        description: `Withdrawal hold for ${ref}`,
        provider: null,
        providerRef: null,
        createdAt: now,
      },
      { sql: "SELECT 1 FROM withdrawal_requests WHERE id = ?", params: [id] },
    ),
    ...entryStatements(
      holdTxnId,
      [
        { userId: input.userId, account: "liability_user_cash", direction: "debit", amountCents: input.amountCents },
        { userId: null, account: "suspense_unmatched", direction: "credit", amountCents: input.amountCents },
      ],
      now,
    ),
  ]);

  if (inserted.changes === 0) {
    throw new WithdrawalError("Insufficient available balance.", "INSUFFICIENT_FUNDS", 400);
  }

  const created = await getWithdrawalById(id);
  if (!created) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
  return created;
}
