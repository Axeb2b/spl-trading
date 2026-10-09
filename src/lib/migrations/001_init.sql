-- SPL Trading — Initial schema
-- All monetary amounts are integer cents (USD) to avoid floating-point drift.
-- Double-entry ledger: every transaction posts balanced debit + credit entries.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash     TEXT NOT NULL,
  name              TEXT NOT NULL DEFAULT '',
  role              TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','restricted','suspended')),
  email_verified_at TEXT,
  referral_code     TEXT NOT NULL UNIQUE,
  referred_by       TEXT REFERENCES users(id),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id              TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN (
                    'deposit','withdrawal','referral_reward','fee','adjustment','reversal')),
  description     TEXT NOT NULL DEFAULT '',
  provider        TEXT,
  provider_ref    TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id             TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES ledger_transactions(id),
  user_id        TEXT REFERENCES users(id),
  account        TEXT NOT NULL CHECK (account IN (
                   'asset_binance','liability_user_cash','revenue_fee',
                   'equity_retained_earnings','suspense_unmatched')),
  direction      TEXT NOT NULL CHECK (direction IN ('debit','credit')),
  amount_cents   INTEGER NOT NULL CHECK (amount_cents > 0),
  currency       TEXT NOT NULL DEFAULT 'USD',
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_user ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_txn ON ledger_entries(transaction_id);

CREATE TABLE IF NOT EXISTS deposit_orders (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  internal_ref  TEXT NOT NULL UNIQUE,
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  currency      TEXT NOT NULL DEFAULT 'USD',
  network       TEXT NOT NULL DEFAULT 'TRC20',
  provider      TEXT NOT NULL DEFAULT 'manual_pending',
  provider_ref  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                  'pending','awaiting_payment','confirming','credited','expired','rejected')),
  verified_by   TEXT REFERENCES users(id),
  verified_at   TEXT,
  reject_reason TEXT,
  expires_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_deposit_orders_user ON deposit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_orders_status ON deposit_orders(status);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  internal_ref    TEXT NOT NULL UNIQUE,
  amount_cents    INTEGER NOT NULL CHECK (amount_cents > 0),
  fee_cents       INTEGER NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  net_cents       INTEGER NOT NULL CHECK (net_cents > 0),
  currency        TEXT NOT NULL DEFAULT 'USD',
  destination_type TEXT NOT NULL,
  destination_ref TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                    'pending','approved','processing','completed','rejected','failed')),
  tx_hash         TEXT,
  reviewed_by     TEXT REFERENCES users(id),
  reviewed_at     TEXT,
  reject_reason   TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON withdrawal_requests(user_id);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id               TEXT PRIMARY KEY,
  referrer_id      TEXT NOT NULL REFERENCES users(id),
  referred_user_id TEXT NOT NULL REFERENCES users(id),
  qualifying_event TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                     'pending','approved','reversed','paid')),
  reward_cents     INTEGER NOT NULL CHECK (reward_cents >= 0),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  paid_at          TEXT
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);

CREATE TABLE IF NOT EXISTS platform_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT REFERENCES users(id),
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
