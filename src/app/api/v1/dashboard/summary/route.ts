import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserCashBalanceCents } from "@/lib/ledger";
import { queryOne } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const balanceCents = await getUserCashBalanceCents(user.id);

  const depositRow = await queryOne<{ total: number | null }>(
    "SELECT COALESCE(SUM(amount_cents), 0) AS total FROM deposit_orders WHERE user_id = ? AND status = 'credited'",
    [user.id],
  );
  const withdrawalPendingRow = await queryOne<{ total: number | null }>(
    "SELECT COALESCE(SUM(amount_cents), 0) AS total FROM withdrawal_requests WHERE user_id = ? AND status IN ('pending','approved','processing')",
    [user.id],
  );

  return NextResponse.json({
    availableCashCents: balanceCents,
    depositedPrincipalCents: Number(depositRow?.total ?? 0),
    pendingWithdrawalCents: Number(withdrawalPendingRow?.total ?? 0),
    currency: "USD",
    note: "Investment valuation and P&L are disabled until an authorized strategy is configured.",
  });
}
