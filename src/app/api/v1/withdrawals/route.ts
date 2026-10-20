import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createWithdrawalRequest, listWithdrawals, WithdrawalError } from "@/lib/withdrawals";
import { isFeatureEnabled } from "@/lib/flags";
import { emitEvent } from "@/lib/realtime/events";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ withdrawals: await listWithdrawals(auth.user.id) });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  if (!(await isFeatureEnabled("withdrawals_enabled"))) {
    return NextResponse.json(
      { error: "Withdrawals are currently disabled. Contact support." },
      { status: 403 },
    );
  }

  let body: { amountCents?: number; destinationType?: string; destinationRef?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Number.isInteger(body.amountCents) || (body.amountCents ?? 0) <= 0) {
    return NextResponse.json({ error: "amountCents must be a positive integer." }, { status: 400 });
  }
  if (!body.destinationType || !body.destinationRef) {
    return NextResponse.json({ error: "destinationType and destinationRef are required." }, { status: 400 });
  }

  try {
    const withdrawal = await createWithdrawalRequest({
      userId: auth.user.id,
      amountCents: body.amountCents!,
      destinationType: body.destinationType,
      destinationRef: body.destinationRef,
    });
    // The realtime stream announces the new request; the cabinet refreshes from it.
    await emitEvent(auth.user.id, "withdrawal.updated", { id: withdrawal.id, status: withdrawal.status });
    await emitEvent(auth.user.id, "overview.updated", { reason: "withdrawal_requested" });
    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (err) {
    if (err instanceof WithdrawalError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not create withdrawal." }, { status: 500 });
  }
}
