import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { listRewardsForUser } from "@/lib/referrals";
import { queryOne } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const invitedRow = await queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM users WHERE referred_by = ?", [user.id]);
  const rewards = await listRewardsForUser(user.id);
  const paidCents = rewards.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.rewardCents, 0);
  const pendingCents = rewards.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.rewardCents, 0);

  return NextResponse.json({
    referralCode: user.referralCode,
    invitedCount: Number(invitedRow?.count ?? 0),
    paidCents,
    pendingCents,
    rewards,
    rules: "You earn a fixed reward when an invited user completes their first verified deposit. Rewards are reviewed and paid by the platform.",
  });
}
