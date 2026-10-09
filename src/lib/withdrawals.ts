import { newId, nowIso, queryOne, queryAll, execute, withTransaction } from "./db";
import { postTransaction, getUserCashBalanceCents, LedgerError } from "./ledger";
import { getWithdrawalFeeBps } from "./flags";

export type WithdrawalRequest = {
  id: string;
  userId: string;
  internalRef: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  currency: string;
  destinationType: string;
  destinationRef: string;
  status: "pending" | "approved" | "processing" | "completed" | "rejected" | "failed";
  txHash: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export class WithdrawalError extends Error {
  constructor(
    message: string,
    public readonly code: "INSUFFICIENT_FUNDS" | "BELOW_MIN" | "NOT_FOUND" | "INVALID_STATE",
    public readonly status: number,
  ) {
    super(message);
    this.name = "WithdrawalError";
  }
}

const MIN_WITHDRAWAL_CENTS = 10_00;

export function createWithdrawalRequest(input: {
  userId: string;
  amountCents: number;
  destinationType: string;
  destinationRef: string;
}): WithdrawalRequest {
  if (input.amountCents < MIN_WITHDRAWAL_CENTS) {
    throw new WithdrawalError(`Minimum withdrawal is $${(MIN_WITHDRAWAL_CENTS / 100).toFixed(2)}.`, "BELOW_MIN", 400);
  }

  const balance = getUserCashBalanceCents(input.userId);
  if (input.amountCents > balance) {
    throw new WithdrawalError("Insufficient available balance.", "INSUFFICIENT_FUNDS", 400);
  }

  const feeBps = getWithdrawalFeeBps();
  const feeCents = Math.ceil((input.amountCents * feeBps) / 10_000);
  const netCents = input.amountCents - feeCents;
  if (netCents <= 0) throw new WithdrawalError("Amount too small after fees.", "BELOW_MIN", 400);

  const id = newId();
  const now = nowIso();
  const ref = `WDR-${Date.now()}-${id.slice(0, 8).toUpperCase()}`;

  withTransaction(() => {
    execute(
      `INSERT INTO withdrawal_requests (id, user_id, internal_ref, amount_cents, fee_cents, net_cents, currency, destination_type, destination_ref, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, ?, 'pending', ?, ?)`,
      [id, input.userId, ref, input.amountCents, feeCents, netCents, input.destinationType, input.destinationRef, now, now],
    );

    try {
      postTransaction({
        idempotencyKey: `withdrawal-hold-${id}`,
        type: "withdrawal",
        description: `Withdrawal hold for ${ref}`,
        entries: [
          { userId: input.userId, account: "liability_user_cash", direction: "debit", amountCents: input.amountCents },
          { userId: null, account: "suspense_unmatched", direction: "credit", amountCents: input.amountCents },
        ],
      });
    } catch (err) {
      if (!(err instanceof LedgerError)) throw err;
      throw err;
    }
  });

  return getWithdrawalById(id)!;
}

export function getWithdrawalById(id: string): WithdrawalRequest | null {
  const row = queryOne<Record<string, unknown>>("SELECT * FROM withdrawal_requests WHERE id = ?", [id]);
  return row ? mapWithdrawal(row) : null;
}

export function listWithdrawals(userId: string, limit = 50): WithdrawalRequest[] {
  const rows = queryAll<Record<string, unknown>>(
    "SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
  return rows.map(mapWithdrawal);
}

export function approveWithdrawal(withdrawalId: string, reviewedBy: string): void {
  transition(withdrawalId, "pending", "approved", reviewedBy);
}

export function startProcessing(withdrawalId: string): void {
  transition(withdrawalId, "approved", "processing", null);
}

/** ONLY call after the payout provider confirms actual settlement. */
export function completeWithdrawal(withdrawalId: string, txHash: string): void {
  withTransaction(() => {
    const w = getWithdrawalById(withdrawalId);
    if (!w) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
    if (w.status === "completed") return;
    if (w.status !== "processing") {
      throw new WithdrawalError(`Cannot complete from '${w.status}'.`, "INVALID_STATE", 409);
    }

    const now = nowIso();
    execute(
      "UPDATE withdrawal_requests SET status = 'completed', tx_hash = ?, updated_at = ? WHERE id = ?",
      [txHash, now, withdrawalId],
    );

    try {
      postTransaction({
        idempotencyKey: `withdrawal-settle-${withdrawalId}`,
        type: "withdrawal",
        description: `Withdrawal settled ${w.internalRef}`,
        providerRef: txHash,
        entries: [
          { userId: null, account: "suspense_unmatched", direction: "debit", amountCents: w.amountCents },
          { userId: null, account: "asset_binance", direction: "credit", amountCents: w.amountCents },
        ],
      });
      if (w.feeCents > 0) {
        postTransaction({
          idempotencyKey: `withdrawal-fee-${withdrawalId}`,
          type: "fee",
          description: `Withdrawal fee for ${w.internalRef}`,
          entries: [
            { userId: null, account: "suspense_unmatched", direction: "debit", amountCents: w.feeCents },
            { userId: null, account: "revenue_fee", direction: "credit", amountCents: w.feeCents },
          ],
        });
      }
    } catch (err) {
      if (err instanceof LedgerError && err.code === "DUPLICATE_KEY") return;
      throw err;
    }
  });
}

export function rejectWithdrawal(withdrawalId: string, reviewedBy: string, reason: string): void {
  withTransaction(() => {
    const w = getWithdrawalById(withdrawalId);
    if (!w) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
    if (w.status === "completed") throw new WithdrawalError("Cannot reject a completed withdrawal.", "INVALID_STATE", 409);

    const now = nowIso();
    execute(
      "UPDATE withdrawal_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, reject_reason = ?, updated_at = ? WHERE id = ?",
      [reviewedBy, now, reason, now, withdrawalId],
    );

    try {
      postTransaction({
        idempotencyKey: `withdrawal-release-${withdrawalId}`,
        type: "reversal",
        description: `Withdrawal rejected, funds released for ${w.internalRef}`,
        entries: [
          { userId: null, account: "suspense_unmatched", direction: "debit", amountCents: w.amountCents },
          { userId: w.userId, account: "liability_user_cash", direction: "credit", amountCents: w.amountCents },
        ],
      });
    } catch (err) {
      if (err instanceof LedgerError && err.code === "DUPLICATE_KEY") return;
      throw err;
    }
  });
}

function transition(id: string, from: string, to: string, reviewedBy: string | null): void {
  const w = getWithdrawalById(id);
  if (!w) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
  if (w.status !== from) throw new WithdrawalError(`Expected '${from}', got '${w.status}'.`, "INVALID_STATE", 409);
  const now = nowIso();
  execute(
    "UPDATE withdrawal_requests SET status = ?, reviewed_by = COALESCE(?, reviewed_by), reviewed_at = COALESCE(?, reviewed_at), updated_at = ? WHERE id = ?",
    [to, reviewedBy, reviewedBy, now, id],
  );
}

function mapWithdrawal(row: Record<string, unknown>): WithdrawalRequest {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    internalRef: String(row.internal_ref),
    amountCents: Number(row.amount_cents),
    feeCents: Number(row.fee_cents),
    netCents: Number(row.net_cents),
    currency: String(row.currency),
    destinationType: String(row.destination_type),
    destinationRef: String(row.destination_ref),
    status: row.status as WithdrawalRequest["status"],
    txHash: (row.tx_hash as string | null) ?? null,
    reviewedBy: (row.reviewed_by as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    rejectReason: (row.reject_reason as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
