import { queryOne, queryAll } from "./db";

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

export async function getWithdrawalById(id: string): Promise<WithdrawalRequest | null> {
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM withdrawal_requests WHERE id = ?", [id]);
  return row ? mapWithdrawal(row) : null;
}

export async function listWithdrawals(userId: string, limit = 50): Promise<WithdrawalRequest[]> {
  const rows = await queryAll<Record<string, unknown>>(
    "SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
  return rows.map(mapWithdrawal);
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
