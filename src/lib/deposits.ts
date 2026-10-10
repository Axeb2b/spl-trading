import { newId, nowIso, queryOne, queryAll, execute, runBatch } from "./db";
import { entryStatements, transactionStatement, getUserCashBalanceCents } from "./ledger";
import { getDepositMinCents, getDepositMaxCents } from "./flags";

export type DepositOrder = {
  id: string;
  userId: string;
  internalRef: string;
  amountCents: number;
  currency: string;
  network: string;
  provider: string;
  providerRef: string | null;
  status: "pending" | "awaiting_payment" | "confirming" | "credited" | "expired" | "rejected";
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectReason: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class DepositError extends Error {
  constructor(
    message: string,
    public readonly code: "BELOW_MIN" | "ABOVE_MAX" | "NOT_FOUND" | "INVALID_STATE",
    public readonly status: number,
  ) {
    super(message);
    this.name = "DepositError";
  }
}

function generateInternalRef(): string {
  return `DEP-${Date.now()}-${newId().slice(0, 8).toUpperCase()}`;
}

const CREDITABLE_STATUSES_SQL = "('pending','awaiting_payment','confirming')";

export async function createDepositOrder(input: {
  userId: string;
  amountCents: number;
  currency?: string;
  network?: string;
}): Promise<DepositOrder> {
  const min = await getDepositMinCents();
  const max = await getDepositMaxCents();
  if (input.amountCents < min) {
    throw new DepositError(`Minimum deposit is $${(min / 100).toFixed(2)}.`, "BELOW_MIN", 400);
  }
  if (input.amountCents > max) {
    throw new DepositError(`Maximum deposit is $${(max / 100).toFixed(2)}.`, "ABOVE_MAX", 400);
  }

  const id = newId();
  const ref = generateInternalRef();
  const now = nowIso();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await execute(
    `INSERT INTO deposit_orders (id, user_id, internal_ref, amount_cents, currency, network, provider, status, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'manual_pending', 'pending', ?, ?, ?)`,
    [id, input.userId, ref, input.amountCents, input.currency ?? "USD", input.network ?? "BEP20", expiresAt, now, now],
  );

  const order = await getDepositOrderById(id);
  if (!order) throw new DepositError("Deposit order not found.", "NOT_FOUND", 404);
  return order;
}

export async function getDepositOrderById(id: string): Promise<DepositOrder | null> {
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM deposit_orders WHERE id = ?", [id]);
  return row ? mapOrder(row) : null;
}

export async function listDepositOrders(userId: string, limit = 50): Promise<DepositOrder[]> {
  const rows = await queryAll<Record<string, unknown>>(
    "SELECT * FROM deposit_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
  return rows.map(mapOrder);
}

/**
 * Verify and credit a deposit. ONLY call after independent payment verification
 * (provider webhook signature verified, or admin manual review completed).
 * Never call this from a frontend callback or user-submitted screenshot.
 *
 * The status transition and the ledger post run in one atomic batch: the
 * conditional UPDATE claims the order (only one concurrent caller can flip it
 * out of a creditable state), and the ledger transaction is gated on that claim
 * having produced exactly these values. The loser sees changes === 0 and
 * reports alreadyCredited.
 */
export async function creditVerifiedDeposit(input: {
  depositId: string;
  verifiedBy: string | null;
  providerRef?: string;
}): Promise<{ alreadyCredited: boolean }> {
  const order = await getDepositOrderById(input.depositId);
  if (!order) throw new DepositError("Deposit order not found.", "NOT_FOUND", 404);
  if (order.status === "credited") return { alreadyCredited: true };
  if (order.status !== "pending" && order.status !== "awaiting_payment" && order.status !== "confirming") {
    throw new DepositError(`Cannot credit a deposit in state '${order.status}'.`, "INVALID_STATE", 409);
  }

  const now = nowIso();
  const txnId = newId();
  const providerRef = input.providerRef ?? null;

  const [claim] = await runBatch([
    {
      sql: `UPDATE deposit_orders SET status = 'credited', verified_by = ?, verified_at = ?, provider_ref = ?, updated_at = ?
            WHERE id = ? AND status IN ${CREDITABLE_STATUSES_SQL}`,
      params: [input.verifiedBy, now, providerRef, now, order.id],
    },
    transactionStatement(
      {
        id: txnId,
        idempotencyKey: `deposit-credit-${order.id}`,
        type: "deposit",
        description: `Deposit credited for order ${order.internalRef}`,
        provider: order.provider,
        providerRef,
        createdAt: now,
      },
      {
        sql: `SELECT 1 FROM deposit_orders
              WHERE id = ? AND status = 'credited' AND verified_at = ? AND updated_at = ?
                AND verified_by IS ? AND provider_ref IS ?`,
        params: [order.id, now, now, input.verifiedBy, providerRef],
      },
    ),
    ...entryStatements(
      txnId,
      [
        { userId: order.userId, account: "liability_user_cash", direction: "credit", amountCents: order.amountCents },
        { userId: null, account: "asset_binance", direction: "debit", amountCents: order.amountCents },
      ],
      now,
    ),
  ]);

  if (claim.changes > 0) return { alreadyCredited: false };

  const current = await getDepositOrderById(order.id);
  if (current?.status === "credited") return { alreadyCredited: true };
  throw new DepositError(
    `Cannot credit a deposit in state '${current?.status ?? order.status}'.`,
    "INVALID_STATE",
    409,
  );
}

export async function rejectDeposit(depositId: string, verifiedBy: string, reason: string): Promise<void> {
  const order = await getDepositOrderById(depositId);
  if (!order) throw new DepositError("Deposit order not found.", "NOT_FOUND", 404);
  if (order.status === "credited") throw new DepositError("Cannot reject a credited deposit.", "INVALID_STATE", 409);
  const now = nowIso();
  const { changes } = await execute(
    "UPDATE deposit_orders SET status = 'rejected', verified_by = ?, reject_reason = ?, updated_at = ? WHERE id = ? AND status <> 'credited'",
    [verifiedBy, reason, now, depositId],
  );
  if (changes === 0) {
    const current = await getDepositOrderById(depositId);
    if (!current) throw new DepositError("Deposit order not found.", "NOT_FOUND", 404);
    if (current.status === "credited") {
      throw new DepositError("Cannot reject a credited deposit.", "INVALID_STATE", 409);
    }
  }
}

function mapOrder(row: Record<string, unknown>): DepositOrder {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    internalRef: String(row.internal_ref),
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    network: String(row.network),
    provider: String(row.provider),
    providerRef: (row.provider_ref as string | null) ?? null,
    status: row.status as DepositOrder["status"],
    verifiedBy: (row.verified_by as string | null) ?? null,
    verifiedAt: (row.verified_at as string | null) ?? null,
    rejectReason: (row.reject_reason as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getUserBalance(userId: string): Promise<number> {
  return getUserCashBalanceCents(userId);
}
