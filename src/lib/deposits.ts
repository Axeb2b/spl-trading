import { newId, nowIso, queryOne, queryAll, execute, withTransaction } from "./db";
import { postTransaction, getUserCashBalanceCents, LedgerError } from "./ledger";
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

export function createDepositOrder(input: {
  userId: string;
  amountCents: number;
  currency?: string;
  network?: string;
}): DepositOrder {
  const min = getDepositMinCents();
  const max = getDepositMaxCents();
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

  execute(
    `INSERT INTO deposit_orders (id, user_id, internal_ref, amount_cents, currency, network, provider, status, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'manual_pending', 'pending', ?, ?, ?)`,
    [id, input.userId, ref, input.amountCents, input.currency ?? "USD", input.network ?? "BEP20", expiresAt, now, now],
  );

  return getDepositOrderById(id)!;
}

export function getDepositOrderById(id: string): DepositOrder | null {
  const row = queryOne<Record<string, unknown>>("SELECT * FROM deposit_orders WHERE id = ?", [id]);
  return row ? mapOrder(row) : null;
}

export function listDepositOrders(userId: string, limit = 50): DepositOrder[] {
  const rows = queryAll<Record<string, unknown>>(
    "SELECT * FROM deposit_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
  return rows.map(mapOrder);
}

/**
 * Verify and credit a deposit. ONLY call after independent payment verification
 * (provider webhook signature verified, or admin manual review completed).
 * Never call this from a frontend callback or user-submitted screenshot.
 */
export function creditVerifiedDeposit(input: {
  depositId: string;
  verifiedBy: string | null;
  providerRef?: string;
  idempotencyKey: string;
}): { alreadyCredited: boolean } {
  return withTransaction(() => {
    const order = getDepositOrderById(input.depositId);
    if (!order) throw new DepositError("Deposit order not found.", "NOT_FOUND", 404);
    if (order.status === "credited") return { alreadyCredited: true };
    if (order.status !== "pending" && order.status !== "awaiting_payment" && order.status !== "confirming") {
      throw new DepositError(`Cannot credit a deposit in state '${order.status}'.`, "INVALID_STATE", 409);
    }

    const now = nowIso();
    execute(
      `UPDATE deposit_orders SET status = 'credited', verified_by = ?, verified_at = ?, provider_ref = ?, updated_at = ? WHERE id = ?`,
      [input.verifiedBy, now, input.providerRef ?? null, now, order.id],
    );

    try {
      postTransaction({
        idempotencyKey: input.idempotencyKey,
        type: "deposit",
        description: `Deposit credited for order ${order.internalRef}`,
        provider: order.provider,
        providerRef: input.providerRef,
        entries: [
          { userId: order.userId, account: "liability_user_cash", direction: "credit", amountCents: order.amountCents },
          { userId: null, account: "asset_binance", direction: "debit", amountCents: order.amountCents },
        ],
      });
    } catch (err) {
      if (err instanceof LedgerError && err.code === "DUPLICATE_KEY") return { alreadyCredited: true };
      throw err;
    }

    return { alreadyCredited: false };
  });
}

export function rejectDeposit(depositId: string, verifiedBy: string, reason: string): void {
  const order = getDepositOrderById(depositId);
  if (!order) throw new DepositError("Deposit order not found.", "NOT_FOUND", 404);
  if (order.status === "credited") throw new DepositError("Cannot reject a credited deposit.", "INVALID_STATE", 409);
  const now = nowIso();
  execute(
    "UPDATE deposit_orders SET status = 'rejected', verified_by = ?, reject_reason = ?, updated_at = ? WHERE id = ?",
    [verifiedBy, reason, now, depositId],
  );
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

export function getUserBalance(userId: string): number {
  return getUserCashBalanceCents(userId);
}
