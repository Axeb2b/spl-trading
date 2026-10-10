import { newId, nowIso, queryOne, queryAll, execute, runBatch } from "./db";
import { entryStatements, transactionStatement } from "./ledger";

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

/**
 * Create the pending reward for a referred user's first credited deposit.
 * The UNIQUE index on referral_rewards(referred_user_id, qualifying_event)
 * (migration 002) plus ON CONFLICT DO NOTHING makes the insert race-proof:
 * concurrent credits of the same deposit produce exactly one reward row.
 */
export async function recordQualifyingDeposit(referredUserId: string): Promise<void> {
  const user = await queryOne<{ id: string; referred_by: string | null }>(
    "SELECT id, referred_by FROM users WHERE id = ?",
    [referredUserId],
  );
  if (!user?.referred_by) return;
  if (user.referred_by === referredUserId) return;

  await execute(
    `INSERT INTO referral_rewards (id, referrer_id, referred_user_id, qualifying_event, status, reward_cents, created_at)
     VALUES (?, ?, ?, 'deposit_credited', 'pending', ?, ?)
     ON CONFLICT(referred_user_id, qualifying_event) DO NOTHING`,
    [newId(), user.referred_by, referredUserId, REFERRAL_REWARD_CENTS, nowIso()],
  );
}

/**
 * Pay a pending reward: the `status = 'pending'` guard makes the transition
 * atomic with the ledger post inside one batch, and the reward ledger key is
 * derived from the reward id so a concurrent duplicate can never double-pay.
 */
export async function approveAndPayReward(rewardId: string): Promise<{ alreadyPaid: boolean }> {
  const reward = await getRewardById(rewardId);
  if (!reward) return { alreadyPaid: false };
  if (reward.status === "paid") return { alreadyPaid: true };
  if (reward.status !== "pending") return { alreadyPaid: false };

  const now = nowIso();
  const txnId = newId();
  const [claim] = await runBatch([
    { sql: "UPDATE referral_rewards SET status = 'paid', paid_at = ? WHERE id = ? AND status = 'pending'", params: [now, rewardId] },
    transactionStatement(
      {
        id: txnId,
        idempotencyKey: `referral-reward-${rewardId}`,
        type: "referral_reward",
        description: "Referral reward for qualifying deposit",
        provider: null,
        providerRef: null,
        createdAt: now,
      },
      { sql: "SELECT 1 FROM referral_rewards WHERE id = ? AND status = 'paid' AND paid_at = ?", params: [rewardId, now] },
    ),
    ...entryStatements(
      txnId,
      [
        { userId: null, account: "revenue_fee", direction: "debit", amountCents: reward.rewardCents },
        { userId: reward.referrerId, account: "liability_user_cash", direction: "credit", amountCents: reward.rewardCents },
      ],
      now,
    ),
  ]);

  if (claim.changes === 0) {
    const current = await getRewardById(rewardId);
    if (current?.status === "paid") return { alreadyPaid: true };
    return { alreadyPaid: false };
  }
  return { alreadyPaid: false };
}

export async function listRewardsForUser(userId: string): Promise<ReferralReward[]> {
  const rows = await queryAll<Record<string, unknown>>(
    "SELECT * FROM referral_rewards WHERE referrer_id = ? ORDER BY created_at DESC",
    [userId],
  );
  return rows.map(mapReward);
}

async function getRewardById(id: string): Promise<ReferralReward | null> {
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM referral_rewards WHERE id = ?", [id]);
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
