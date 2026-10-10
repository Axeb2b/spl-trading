-- One referral reward per (referred user, qualifying event).
-- recordQualifyingDeposit used SELECT-then-INSERT, so two concurrent credits of
-- the same referred user's first deposit could both insert and double-pay.
-- The unique index makes the race resolve to a single row; the insert uses
-- ON CONFLICT(referred_user_id, qualifying_event) DO NOTHING.
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_rewards_unique_event
  ON referral_rewards(referred_user_id, qualifying_event);
