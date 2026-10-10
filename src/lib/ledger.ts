import { newId, nowIso, queryOne, queryAll, runBatch, type SqlStatement } from "./db";

export type LedgerAccount =
  | "asset_binance"
  | "liability_user_cash"
  | "revenue_fee"
  | "equity_retained_earnings"
  | "suspense_unmatched";

export type LedgerDirection = "debit" | "credit";

export type LedgerEntryInput = {
  userId: string | null;
  account: LedgerAccount;
  direction: LedgerDirection;
  amountCents: number;
  currency?: string;
};

export type PostTransactionInput = {
  idempotencyKey: string;
  type: "deposit" | "withdrawal" | "referral_reward" | "fee" | "adjustment" | "reversal";
  description?: string;
  provider?: string;
  providerRef?: string;
  entries: LedgerEntryInput[];
};

export type PostedTransaction = {
  id: string;
  idempotencyKey: string;
  alreadyPosted: boolean;
};

export type LedgerTxnInput = {
  id: string;
  idempotencyKey: string;
  type: PostTransactionInput["type"];
  description: string;
  provider: string | null;
  providerRef: string | null;
  createdAt: string;
};

export class LedgerError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "UNBALANCED"
      | "INVALID_AMOUNT"
      | "NO_ENTRIES"
      | "DUPLICATE_KEY"
      | "INSUFFICIENT_FUNDS",
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

/**
 * Statement that inserts a ledger transaction unless its idempotency key
 * already exists. `guard` gates the insert on other business state living in
 * the same batch (e.g. "the deposit order was just credited by this call"), so
 * a caller that loses a race posts nothing. `ON CONFLICT DO NOTHING` covers the
 * UNIQUE(idempotency_key) constraint as a backstop: the row simply is not
 * re-inserted, and the caller detects it via `readPostedTransaction`.
 */
export function transactionStatement(txn: LedgerTxnInput, guard?: { sql: string; params?: unknown[] }): SqlStatement {
  return {
    sql: `INSERT INTO ledger_transactions (id, idempotency_key, type, description, provider, provider_ref, created_at)
          SELECT ?, ?, ?, ?, ?, ?, ?
          WHERE ${guard ? `EXISTS (${guard.sql})` : "1 = 1"}
          ON CONFLICT DO NOTHING`,
    params: [
      txn.id,
      txn.idempotencyKey,
      txn.type,
      txn.description,
      txn.provider,
      txn.providerRef,
      txn.createdAt,
      ...(guard?.params ?? []),
    ],
  };
}

/**
 * Entry statements for a transaction. Each entry only lands when its parent
 * transaction row exists, so a batch can never write orphaned entries; if any
 * entry fails, the surrounding batch rolls the transaction row back with it.
 */
export function entryStatements(
  txnId: string,
  entries: LedgerEntryInput[],
  createdAt: string,
): SqlStatement[] {
  return entries.map((entry) => ({
    sql: `INSERT INTO ledger_entries (id, transaction_id, user_id, account, direction, amount_cents, currency, created_at)
          SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM ledger_transactions WHERE id = ?)`,
    params: [
      newId(),
      txnId,
      entry.userId,
      entry.account,
      entry.direction,
      entry.amountCents,
      entry.currency ?? "USD",
      createdAt,
      txnId,
    ],
  }));
}

/** Classify a batch outcome: did this caller's transaction id win the insert? */
export async function readPostedTransaction(
  idempotencyKey: string,
  txnId: string,
): Promise<PostedTransaction> {
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM ledger_transactions WHERE idempotency_key = ?",
    [idempotencyKey],
  );
  if (existing && existing.id !== txnId) {
    return { id: existing.id, idempotencyKey, alreadyPosted: true };
  }
  return { id: txnId, idempotencyKey, alreadyPosted: false };
}

/**
 * Post a balanced double-entry transaction atomically (transaction row and all
 * entries move together in one local transaction / D1 batch).
 * Idempotent: if idempotencyKey already exists, returns the existing
 * transaction without posting again (alreadyPosted=true). Never double-credits.
 */
export async function postTransaction(input: PostTransactionInput): Promise<PostedTransaction> {
  validateEntries(input.entries);

  const txnId = newId();
  const now = nowIso();

  await runBatch([
    transactionStatement({
      id: txnId,
      idempotencyKey: input.idempotencyKey,
      type: input.type,
      description: input.description ?? "",
      provider: input.provider ?? null,
      providerRef: input.providerRef ?? null,
      createdAt: now,
    }),
    ...entryStatements(txnId, input.entries, now),
  ]);

  return readPostedTransaction(input.idempotencyKey, txnId);
}

function validateEntries(entries: LedgerEntryInput[]): void {
  if (entries.length === 0) throw new LedgerError("Transaction must have at least one entry.", "NO_ENTRIES");

  let debitSum = 0;
  let creditSum = 0;
  for (const e of entries) {
    if (!Number.isInteger(e.amountCents) || e.amountCents <= 0) {
      throw new LedgerError(`Invalid amount: ${e.amountCents}. Must be positive integer cents.`, "INVALID_AMOUNT");
    }
    if (e.direction === "debit") debitSum += e.amountCents;
    else creditSum += e.amountCents;
  }
  if (debitSum !== creditSum) {
    throw new LedgerError(`Unbalanced transaction: debits=${debitSum} credits=${creditSum}.`, "UNBALANCED");
  }
}

/**
 * Get a user's available cash balance in cents.
 * liability_user_cash is a credit-normal account: balance = credits - debits.
 */
export async function getUserCashBalanceCents(userId: string): Promise<number> {
  const row = await queryOne<{ balance: number | null }>(
    `SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount_cents ELSE -amount_cents END), 0) AS balance
     FROM ledger_entries WHERE user_id = ? AND account = 'liability_user_cash'`,
    [userId],
  );
  return Number(row?.balance ?? 0);
}

export async function getUserLedgerEntries(userId: string, limit = 100): Promise<unknown[]> {
  return queryAll(
    `SELECT e.id, e.account, e.direction, e.amount_cents, e.currency, e.created_at,
            t.type, t.description, t.provider, t.provider_ref
     FROM ledger_entries e
     JOIN ledger_transactions t ON t.id = e.transaction_id
     WHERE e.user_id = ?
     ORDER BY e.created_at DESC
     LIMIT ?`,
    [userId, limit],
  );
}
