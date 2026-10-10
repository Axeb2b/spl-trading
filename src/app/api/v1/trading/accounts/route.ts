import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { listTradingAccounts, createTradingAccount, getTradingSummary, TradingError } from "@/lib/trading";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const [accounts, summary] = await Promise.all([
    listTradingAccounts(auth.user.id),
    getTradingSummary(auth.user.id),
  ]);
  return NextResponse.json({ accounts, summary });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  let body: { label?: string; currency?: string; network?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const account = await createTradingAccount({
      userId: auth.user.id,
      label: body.label?.trim() || "Trading",
      currency: body.currency,
      network: body.network,
    });
    return NextResponse.json({ account }, { status: 201 });
  } catch (err) {
    if (err instanceof TradingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}