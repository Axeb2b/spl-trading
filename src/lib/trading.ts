import { newId, nowIso, queryOne, queryAll, execute } from "./db";

export type TradingAccount = {
  id: string;
  userId: string;
  label: string;
  currency: string;
  network: string;
  balanceCents: number;
  status: "active" | "frozen" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type Trade = {
  id: string;
  userId: string;
  accountId: string;
  internalRef: string;
  side: "buy" | "sell";
  symbol: string;
  amountCents: number;
  priceCents: number;
  feeCents: number;
  proceedsCents: number;
  status: "pending" | "filled" | "cancelled" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export class TradingError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "INVALID_STATE" | "INSUFFICIENT_FUNDS" | "INVALID_INPUT",
    public readonly status: number,
  ) {
    super(message);
    this.name = "TradingError";
  }
}

/** Default trading fee on a fill, in basis points (25 bps = 0.25%). */
export const TRADE_FEE_BPS = 25;
/** Default execution price for the USDT/USD pair, in cents (1.00). */
export const DEFAULT_PRICE_CENTS = 100;

function mapAccount(row: Record<string, unknown>): TradingAccount {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    label: String(row.label),
    currency: String(row.currency),
    network: String(row.network),
    balanceCents: Number(row.balance_cents),
    status: row.status as TradingAccount["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapTrade(row: Record<string, unknown>): Trade {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    accountId: String(row.account_id),
    internalRef: String(row.internal_ref),
    side: row.side as Trade["side"],
    symbol: String(row.symbol),
    amountCents: Number(row.amount_cents),
    priceCents: Number(row.price_cents),
    feeCents: Number(row.fee_cents),
    proceedsCents: Number(row.proceeds_cents),
    status: row.status as Trade["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function generateRef(side: Trade["side"]): string {
  const prefix = side === "buy" ? "BUY" : "SELL";
  return `${prefix}-${Date.now()}-${newId().slice(0, 6).toUpperCase()}`;
}

/** List a user's trading accounts, creating a default one on first visit. */
export async function listTradingAccounts(userId: string): Promise<TradingAccount[]> {
  const rows = await queryAll<Record<string, unknown>>(
    "SELECT * FROM trading_accounts WHERE user_id = ? ORDER BY created_at ASC",
    [userId],
  );
  if (rows.length > 0) return rows.map(mapAccount);
  const created = await createTradingAccount({ userId, label: "Main" });
  return [created];
}

export async function createTradingAccount(input: {
  userId: string;
  label?: string;
  currency?: string;
  network?: string;
}): Promise<TradingAccount> {
  const id = newId();
  const now = nowIso();
  await execute(
    `INSERT INTO trading_accounts (id, user_id, label, currency, network, balance_cents, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 'active', ?, ?)`,
    [id, input.userId, input.label ?? "Main", input.currency ?? "USDT", input.network ?? "BEP20", now, now],
  );
  const account = await getTradingAccount(id);
  if (!account) throw new TradingError("Trading account not found.", "NOT_FOUND", 404);
  return account;
}

export async function getTradingAccount(id: string): Promise<TradingAccount | null> {
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM trading_accounts WHERE id = ?", [id]);
  return row ? mapAccount(row) : null;
}

export async function listTrades(userId: string, limit = 100): Promise<Trade[]> {
  const rows = await queryAll<Record<string, unknown>>(
    "SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, limit],
  );
  return rows.map(mapTrade);
}

/** Create a trade iteration. Buys/sells do not move funds until the trade fills. */
export async function createTrade(input: {
  userId: string;
  accountId: string;
  side: "buy" | "sell";
  amountCents: number;
  priceCents?: number;
}): Promise<Trade> {
  const account = await getTradingAccount(input.accountId);
  if (!account || account.userId !== input.userId) {
    throw new TradingError("Trading account not found.", "NOT_FOUND", 404);
  }
  if (account.status !== "active") {
    throw new TradingError("Trading account is not active.", "INVALID_STATE", 409);
  }
  if (input.amountCents <= 0) {
    throw new TradingError("Amount must be greater than zero.", "INVALID_INPUT", 400);
  }
  if (input.side === "sell" && input.amountCents > account.balanceCents) {
    throw new TradingError("Insufficient balance for this sell order.", "INSUFFICIENT_FUNDS", 400);
  }

  const priceCents = input.priceCents ?? DEFAULT_PRICE_CENTS;
  const feeCents = Math.round((input.amountCents * TRADE_FEE_BPS) / 10_000);
  const proceedsCents = Math.round((input.amountCents * priceCents) / 100) - feeCents;
  const id = newId();
  const now = nowIso();

  await execute(
    `INSERT INTO trades (id, user_id, account_id, internal_ref, side, symbol, amount_cents, price_cents, fee_cents, proceeds_cents, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'USDT/USD', ?, ?, ?, ?, 'pending', ?, ?)`,
    [id, input.userId, input.accountId, generateRef(input.side), input.side, input.amountCents, priceCents, feeCents, proceedsCents, now, now],
  );

  const trade = await getTradeById(id);
  if (!trade) throw new TradingError("Trade not found.", "NOT_FOUND", 404);
  return trade;
}

export async function getTradeById(id: string): Promise<Trade | null> {
  const row = await queryOne<Record<string, unknown>>("SELECT * FROM trades WHERE id = ?", [id]);
  return row ? mapTrade(row) : null;
}

/**
 * Fill a pending trade: buys credit the account balance, sells debit it.
 * The conditional UPDATE claims the row so a concurrent fill cannot double-apply.
 */
export async function fillTrade(tradeId: string, userId: string): Promise<{ trade: Trade; alreadyFilled: boolean }> {
  const trade = await getTradeById(tradeId);
  if (!trade || trade.userId !== userId) throw new TradingError("Trade not found.", "NOT_FOUND", 404);
  if (trade.status === "filled") return { trade, alreadyFilled: true };
  if (trade.status !== "pending") throw new TradingError(`Cannot fill a trade in state '${trade.status}'.`, "INVALID_STATE", 409);

  const account = await getTradingAccount(trade.accountId);
  if (!account) throw new TradingError("Trading account not found.", "NOT_FOUND", 404);

  const now = nowIso();
  const delta = trade.side === "buy" ? trade.amountCents : -trade.amountCents;
  const nextBalance = account.balanceCents + delta;
  if (nextBalance < 0) throw new TradingError("Insufficient balance to fill this trade.", "INSUFFICIENT_FUNDS", 400);

  const claim = await execute(
    "UPDATE trades SET status = 'filled', updated_at = ? WHERE id = ? AND status = 'pending'",
    [now, tradeId],
  );
  if (claim.changes === 0) {
    const current = await getTradeById(tradeId);
    if (current?.status === "filled") return { trade: current, alreadyFilled: true };
    throw new TradingError("Trade is no longer pending.", "INVALID_STATE", 409);
  }

  await execute("UPDATE trading_accounts SET balance_cents = ?, updated_at = ? WHERE id = ?", [
    nextBalance,
    now,
    account.id,
  ]);

  const filled = await getTradeById(tradeId);
  if (!filled) throw new TradingError("Trade not found.", "NOT_FOUND", 404);
  return { trade: filled, alreadyFilled: false };
}

export async function cancelTrade(tradeId: string, userId: string): Promise<Trade> {
  const trade = await getTradeById(tradeId);
  if (!trade || trade.userId !== userId) throw new TradingError("Trade not found.", "NOT_FOUND", 404);
  if (trade.status !== "pending") throw new TradingError(`Cannot cancel a trade in state '${trade.status}'.`, "INVALID_STATE", 409);

  await execute("UPDATE trades SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'pending'", [
    nowIso(),
    tradeId,
  ]);
  const cancelled = await getTradeById(tradeId);
  if (!cancelled) throw new TradingError("Trade not found.", "NOT_FOUND", 404);
  return cancelled;
}

/** Aggregate figures for the trading dashboard. */
export async function getTradingSummary(userId: string): Promise<{
  balanceCents: number;
  openTrades: number;
  filledTrades: number;
  volumeCents: number;
}> {
  // Read the balance directly: listTradingAccounts() has a create-on-empty side
  // effect, and calling it from a summary must never mint extra accounts.
  const balance = await queryOne<{ total: number | null }>(
    "SELECT COALESCE(SUM(balance_cents),0) AS total FROM trading_accounts WHERE user_id = ?",
    [userId],
  );
  const balanceCents = Number(balance?.total ?? 0);
  const open = await queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM trades WHERE user_id = ? AND status = 'pending'",
    [userId],
  );
  const filled = await queryOne<{ count: number; total: number | null }>(
    "SELECT COUNT(*) AS count, COALESCE(SUM(amount_cents),0) AS total FROM trades WHERE user_id = ? AND status = 'filled'",
    [userId],
  );
  return {
    balanceCents,
    openTrades: Number(open?.count ?? 0),
    filledTrades: Number(filled?.count ?? 0),
    volumeCents: Number(filled?.total ?? 0),
  };
}
