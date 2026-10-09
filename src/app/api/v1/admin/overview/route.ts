import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { queryOne } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = requireAdmin(request);
  if ("error" in auth) return auth.error;

  const users = queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM users");
  const depositsCredited = queryOne<{ total: number | null; count: number }>(
    "SELECT COALESCE(SUM(amount_cents),0) AS total, COUNT(*) AS count FROM deposit_orders WHERE status='credited'",
  );
  const depositsPending = queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM deposit_orders WHERE status IN ('pending','awaiting_payment','confirming')",
  );
  const withdrawalsPending = queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM withdrawal_requests WHERE status IN ('pending','approved','processing')",
  );
  const rewardsPending = queryOne<{ count: number; total: number | null }>(
    "SELECT COUNT(*) AS count, COALESCE(SUM(reward_cents),0) AS total FROM referral_rewards WHERE status='pending'",
  );

  return NextResponse.json({
    users: Number(users?.count ?? 0),
    depositsCreditedTotalCents: Number(depositsCredited?.total ?? 0),
    depositsCreditedCount: Number(depositsCredited?.count ?? 0),
    depositsPendingCount: Number(depositsPending?.count ?? 0),
    withdrawalsPendingCount: Number(withdrawalsPending?.count ?? 0),
    referralRewardsPendingCount: Number(rewardsPending?.count ?? 0),
    referralRewardsPendingCents: Number(rewardsPending?.total ?? 0),
  });
}
