import { newId, nowIso, queryOne, queryAll, execute, withTransaction } from "./db";
import { postTransaction, LedgerError } from "./ledger";

export type ReferralReward = {
  id: string;
  referrerId: string;
  referredUserId: string;
  qualifyingEvent: string;
  status: "pending" | "approved" | "reversed" | "paid";
  rewardCents: number;
  createdAt: string;
  paidAt: string | null;
};

const REFERRAL_REWARD_CENTS = 500_00;

export function recordQualifyingDeposit(referredUserId: string): void {
  const user = queryOne<{ id: string; referred_by: string | null }>("SELECT id, referred_by FROM users WHERE id = ?", [referredUserId]);
  if (!user?.referred_by) return;
  if (user.referred_by === referredUserId) return;

  const existing = queryOne<{ id: string }>(
    "SELECT id FROM referral_rewards WHERE referred_user_id = ? AND qualifying_event = 'deposit_credited'",
    [referredUserId],
  );
  if (existing) return;

  execute(
    `INSERT INTO referral_rewards (id, referrer_id, referred_user_id, qualifying_event, status, reward_cents, created_at)
     VALUES (?, ?, ?, 'deposit_credited', 'pending', ?, ?)`,
    [newId(), user.referred_by, referredUserId, REFERRAL_REWARD_CENTS, nowIso()],
  );
}

export function approveAndPayReward(rewardId: string): { alreadyPaid: boolean } {
  return withTransaction(() => {
    const reward = getRewardById(rewardId);
    if (!reward) return { alreadyPaid: false };
    if (reward.status === "paid") return { alreadyPaid: true };
    if (reward.status !== "pending") return { alreadyPaid: false };

    const now = nowIso();
    execute("UPDATE referral_rewards SET status = 'paid', paid_at = ? WHERE id = ?", [now, rewardId]);

    try {
      postTransaction({
        idempotencyKey: `referral-reward-${rewardId}`,
        type: "referral_reward",
        description: `Referral reward for qualifying deposit`,
        entries: [
          { userId: null, account: "revenue_fee", direction: "debit", amountCents: reward.rewardCents },
          { userId: reward.referrerId, account: "liability_user_cash", direction: "credit", amountCents: reward.rewardCents },
        ],
      });
    } catch (err) {
      if (err instanceof LedgerError && err.code === "DUPLICATE_KEY") return { alreadyPaid: true };
      throw err;
    }
    return { alreadyPaid: false };
  });
}

export function listRewardsForUser(userId: string): ReferralReward[] {
  const rows = queryAll<Record<string, unknown>>(
    "SELECT * FROM referral_rewards WHERE referrer_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map(mapReward);
}

function getRewardById(id: string): ReferralReward | null {
  const row = queryOne<Record<string, unknown>>("SELECT * FROM referral_rewards WHERE id = ?", [id]);
  return row ? mapReward(row) : null;
}

function mapReward(row: Record<string, unknown>): ReferralReward {
  return {
    id: String(row.id),
    referrerId: String(row.referrer_id),
    referredUserId: String(row.referred_user_id),
    qualifyingEvent: String(row.qualifying_event),
    status: row.status as ReferralReward["status"],
    rewardCents: Number(row.reward_cents),
    createdAt: String(row.created_at),
    paidAt: (row.paid_at as string | null) ?? null,
  };
}
