import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { queryAll, queryOne } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const accounts = await queryAll<Record<string, unknown>>(
    "SELECT * FROM trading_accounts ORDER BY created_at DESC LIMIT 200",
  );
  const trades = await queryAll<Record<string, unknown>>(
    "SELECT * FROM trades ORDER BY created_at DESC LIMIT 200",
  );
  const totals = await queryOne<{ accounts: number; balance: number | null; open: number; volume: number | null }>(
    `SELECT
       (SELECT COUNT(*) FROM trading_accounts) AS accounts,
       (SELECT COALESCE(SUM(balance_cents),0) FROM trading_accounts) AS balance,
       (SELECT COUNT(*) FROM trades WHERE status='pending') AS open,
       (SELECT COALESCE(SUM(amount_cents),0) FROM trades WHERE status='filled') AS volume`,
  );

  return NextResponse.json({
    accounts,
    trades,
    totals: {
      accounts: Number(totals?.accounts ?? 0),
      balanceCents: Number(totals?.balance ?? 0),
      openTrades: Number(totals?.open ?? 0),
      volumeCents: Number(totals?.volume ?? 0),
    },
  });
}