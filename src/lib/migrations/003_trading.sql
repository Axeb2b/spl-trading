-- SPL Trading — Trading accounts & USDT trade iterations
-- Adds first-class trading accounts (USDT balances) and a trade ledger so the
-- cabinet can show real balances and an order history instead of static stubs.
--
-- All monetary amounts stay in integer cents (USD-equivalent) to match the rest
-- of the schema and avoid floating-point drift.

CREATE TABLE IF NOT EXISTS trading_accounts (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  label         TEXT NOT NULL DEFAULT 'Main',
  currency      TEXT NOT NULL DEFAULT 'USDT',
  network       TEXT NOT NULL DEFAULT 'BEP20',
  balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen','closed')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_user ON trading_accounts(user_id);

CREATE TABLE IF NOT EXISTS trades (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  account_id   TEXT NOT NULL REFERENCES trading_accounts(id),
  internal_ref TEXT NOT NULL UNIQUE,
  side         TEXT NOT NULL CHECK (side IN ('buy','sell')),
  symbol       TEXT NOT NULL DEFAULT 'USDT/USD',
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  price_cents  INTEGER NOT NULL CHECK (price_cents > 0),
  fee_cents    INTEGER NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  proceeds_cents INTEGER NOT NULL DEFAULT 0 CHECK (proceeds_cents >= 0),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','filled','cancelled','rejected')),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
