import { getDb, newId, nowIso, withTransaction, queryOne, queryAll } from "./db";

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
 * Post a balanced double-entry transaction atomically.
 * Idempotent: if idempotencyKey already exists, returns the existing transaction
 * without posting again (alreadyPosted=true). Never double-credits.
 */
export function postTransaction(input: PostTransactionInput): PostedTransaction {
  validateEntries(input.entries);

  return withTransaction(() => {
    const existing = queryOne<{ id: string }>(
      "SELECT id FROM ledger_transactions WHERE idempotency_key = ?",
      [input.idempotencyKey],
    );
    if (existing) {
      return { id: existing.id, idempotencyKey: input.idempotencyKey, alreadyPosted: true };
    }

    const txnId = newId();
    const now = nowIso();
    const db = getDb();

    db.prepare(
      `INSERT INTO ledger_transactions (id, idempotency_key, type, description, provider, provider_ref, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(txnId, input.idempotencyKey, input.type, input.description ?? "", input.provider ?? null, input.providerRef ?? null, now);

    const insertEntry = db.prepare(
      `INSERT INTO ledger_entries (id, transaction_id, user_id, account, direction, amount_cents, currency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const entry of input.entries) {
      insertEntry.run(newId(), txnId, entry.userId, entry.account, entry.direction, entry.amountCents, entry.currency ?? "USD", now);
    }

    return { id: txnId, idempotencyKey: input.idempotencyKey, alreadyPosted: false };
  });
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
export function getUserCashBalanceCents(userId: string): number {
  const row = queryOne<{ balance: number | null }>(
    `SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount_cents ELSE -amount_cents END), 0) AS balance
     FROM ledger_entries WHERE user_id = ? AND account = 'liability_user_cash'`,
    [userId],
  );
  return Number(row?.balance ?? 0);
}

export function getUserLedgerEntries(userId: string, limit = 100): unknown[] {
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
