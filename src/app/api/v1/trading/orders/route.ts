import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { listTrades, createTrade, fillTrade, cancelTrade, TradingError, DEFAULT_PRICE_CENTS, TRADE_FEE_BPS } from "@/lib/trading";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  return NextResponse.json({
    trades: await listTrades(auth.user.id),
    config: { priceCents: DEFAULT_PRICE_CENTS, feeBps: TRADE_FEE_BPS },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  let body: { action?: string; accountId?: string; side?: "buy" | "sell"; amountCents?: number; tradeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const action = body.action ?? "create";

  try {
    if (action === "create") {
      if (!body.accountId || !body.side || !Number.isInteger(body.amountCents) || (body.amountCents ?? 0) <= 0) {
        return NextResponse.json(
          { error: "accountId, side and a positive integer amountCents are required." },
          { status: 400 },
        );
      }
      if (body.side !== "buy" && body.side !== "sell") {
        return NextResponse.json({ error: "side must be 'buy' or 'sell'." }, { status: 400 });
      }
      const trade = await createTrade({
        userId: auth.user.id,
        accountId: body.accountId,
        side: body.side,
        amountCents: body.amountCents!,
      });
      return NextResponse.json({ trade }, { status: 201 });
    }

    if (!body.tradeId) return NextResponse.json({ error: "tradeId is required." }, { status: 400 });

    if (action === "fill") {
      const result = await fillTrade(body.tradeId, auth.user.id);
      return NextResponse.json({ trade: result.trade, alreadyFilled: result.alreadyFilled });
    }
    if (action === "cancel") {
      const trade = await cancelTrade(body.tradeId, auth.user.id);
      return NextResponse.json({ trade });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    if (err instanceof TradingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}