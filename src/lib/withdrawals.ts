import { newId, nowIso, execute, runBatch, queryOne, type SqlStatement } from "./db";
import { entryStatements, transactionStatement } from "./ledger";
import { WithdrawalError, getWithdrawalById } from "./withdrawal-view";

export { createWithdrawalRequest } from "./withdrawal-create";
export { getWithdrawalById, listWithdrawals, WithdrawalError } from "./withdrawal-view";
export type { WithdrawalRequest } from "./withdrawal-view";

export async function approveWithdrawal(withdrawalId: string, reviewedBy: string): Promise<void> {
  await transition(withdrawalId, "pending", "approved", reviewedBy);
}

export async function startProcessing(withdrawalId: string): Promise<void> {
  await transition(withdrawalId, "approved", "processing", null);
}

/** ONLY call after an authorized operator independently confirms actual on-chain settlement. */
export async function completeWithdrawal(withdrawalId: string, txHash: string): Promise<void> {
  const w = await getWithdrawalById(withdrawalId);
  if (!w) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
  if (w.status === "completed") {
    if (w.txHash === txHash) return;
    throw new WithdrawalError("This payout is already completed with a different BSC transaction.", "INVALID_STATE", 409);
  }
  if (w.status !== "processing") {
    throw new WithdrawalError(`Cannot complete from '${w.status}'.`, "INVALID_STATE", 409);
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw new WithdrawalError("A valid BSC transaction hash is required to complete a payout.", "INVALID_STATE", 400);
  }
  const transactionAlreadyUsed = await queryOne<{ id: string }>(
    "SELECT id FROM withdrawal_requests WHERE tx_hash = ? AND id <> ? LIMIT 1",
    [txHash, withdrawalId],
  );
  if (transactionAlreadyUsed) {
    throw new WithdrawalError("This BSC transaction is already associated with another payout.", "INVALID_STATE", 409);
  }

  const now = nowIso();
  const settleTxnId = newId();
  const settledGuard = {
    sql: "SELECT 1 FROM withdrawal_requests WHERE id = ? AND status = 'completed' AND tx_hash IS ?",
    params: [withdrawalId, txHash],
  };
  const statements: SqlStatement[] = [
    {
      sql: "UPDATE withdrawal_requests SET status = 'completed', tx_hash = ?, updated_at = ? WHERE id = ? AND status = 'processing'",
      params: [txHash, now, withdrawalId],
    },
    transactionStatement(
      {
        id: settleTxnId,
        idempotencyKey: `withdrawal-settle-${withdrawalId}`,
        type: "withdrawal",
        description: `Withdrawal settled ${w.internalRef}`,
        provider: null,
        providerRef: txHash,
        createdAt: now,
      },
      settledGuard,
    ),
    ...entryStatements(
      settleTxnId,
      [
        { userId: null, account: "suspense_unmatched", direction: "debit", amountCents: w.netCents },
        { userId: null, account: "asset_binance", direction: "credit", amountCents: w.netCents },
      ],
      now,
    ),
  ];
  if (w.feeCents > 0) {
    const feeTxnId = newId();
    statements.push(
      transactionStatement(
        {
          id: feeTxnId,
          idempotencyKey: `withdrawal-fee-${withdrawalId}`,
          type: "fee",
          description: `Withdrawal fee for ${w.internalRef}`,
          provider: null,
          providerRef: null,
          createdAt: now,
        },
        settledGuard,
      ),
      ...entryStatements(
        feeTxnId,
        [
          { userId: null, account: "suspense_unmatched", direction: "debit", amountCents: w.feeCents },
          { userId: null, account: "revenue_fee", direction: "credit", amountCents: w.feeCents },
        ],
        now,
      ),
    );
  }

  const [claim] = await runBatch(statements);
  if (claim.changes > 0) return;

  const current = await getWithdrawalById(withdrawalId);
  if (!current) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
  if (current.status === "completed") return;
  throw new WithdrawalError(`Cannot complete from '${current.status}'.`, "INVALID_STATE", 409);
}

export async function rejectWithdrawal(
  withdrawalId: string,
  reviewedBy: string,
  reason: string,
): Promise<void> {
  const w = await getWithdrawalById(withdrawalId);
  if (!w) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
  if (w.status !== "pending" && w.status !== "approved") {
    throw new WithdrawalError("Only pending or approved payouts can be rejected before processing.", "INVALID_STATE", 409);
  }

  const now = nowIso();
  const releaseTxnId = newId();
  const [claim] = await runBatch([
    {
      sql: `UPDATE withdrawal_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, reject_reason = ?, updated_at = ?
            WHERE id = ? AND status IN ('pending','approved')`,
      params: [reviewedBy, now, reason, now, withdrawalId],
    },
    transactionStatement(
      {
        id: releaseTxnId,
        idempotencyKey: `withdrawal-release-${withdrawalId}`,
        type: "reversal",
        description: `Withdrawal rejected, funds released for ${w.internalRef}`,
        provider: null,
        providerRef: null,
        createdAt: now,
      },
      { sql: "SELECT 1 FROM withdrawal_requests WHERE id = ? AND status = 'rejected' AND reject_reason IS ?", params: [withdrawalId, reason] },
    ),
    ...entryStatements(
      releaseTxnId,
      [
        { userId: null, account: "suspense_unmatched", direction: "debit", amountCents: w.amountCents },
        { userId: w.userId, account: "liability_user_cash", direction: "credit", amountCents: w.amountCents },
      ],
      now,
    ),
  ]);
  if (claim.changes > 0) return;

  const current = await getWithdrawalById(withdrawalId);
  if (!current) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
  if (current.status !== "pending" && current.status !== "approved") {
    throw new WithdrawalError(`Cannot reject a payout in '${current.status}' state.`, "INVALID_STATE", 409);
  }
}

async function transition(id: string, from: string, to: string, reviewedBy: string | null): Promise<void> {
  const w = await getWithdrawalById(id);
  if (!w) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
  if (w.status !== from) throw new WithdrawalError(`Expected '${from}', got '${w.status}'.`, "INVALID_STATE", 409);
  const now = nowIso();
  const { changes } = await execute(
    "UPDATE withdrawal_requests SET status = ?, reviewed_by = COALESCE(?, reviewed_by), reviewed_at = COALESCE(?, reviewed_at), updated_at = ? WHERE id = ? AND status = ?",
    [to, reviewedBy, reviewedBy, now, id, from],
  );
  if (changes === 0) {
    const current = await getWithdrawalById(id);
    if (!current) throw new WithdrawalError("Withdrawal not found.", "NOT_FOUND", 404);
    throw new WithdrawalError(`Expected '${from}', got '${current.status}'.`, "INVALID_STATE", 409);
  }
}
