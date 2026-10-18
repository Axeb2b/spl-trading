import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createWithdrawalRequest, listWithdrawals, WithdrawalError } from "@/lib/withdrawals";
import { getWithdrawalFeeBps, isFeatureEnabled } from "@/lib/flags";
import { getDepositEligibility } from "@/lib/deposit-eligibility";
import { MIN_WITHDRAWAL_CENTS } from "@/lib/withdrawal-create";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const [withdrawals, eligibility, feeBps, withdrawalsEnabled] = await Promise.all([
    listWithdrawals(auth.user.id),
    getDepositEligibility(auth.user.id),
    getWithdrawalFeeBps(),
    isFeatureEnabled("withdrawals_enabled"),
  ]);
  return NextResponse.json({
    withdrawals,
    eligibility,
    withdrawalsEnabled,
    limits: { minCents: MIN_WITHDRAWAL_CENTS, feeBps },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  if (!(await isFeatureEnabled("withdrawals_enabled"))) {
    return NextResponse.json(
      { error: "Payout requests are not enabled for this deployment." },
      { status: 403 },
    );
  }

  const eligibility = await getDepositEligibility(auth.user.id);
  if (!eligibility.eligible) {
    return NextResponse.json(
      {
        error: "A verified deposit of at least $500.00 is required before payout requests unlock.",
        code: "VERIFIED_DEPOSIT_REQUIRED",
        eligibility,
      },
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
  if (body.destinationType !== "BEP20") {
    return NextResponse.json({ error: "Only USDT on BNB Smart Chain (BEP-20) is supported." }, { status: 400 });
  }
  if (!body.destinationRef || !/^0x[a-fA-F0-9]{40}$/.test(body.destinationRef)) {
    return NextResponse.json({ error: "Enter a valid 0x-prefixed BEP-20 destination address." }, { status: 400 });
  }

  try {
    const withdrawal = await createWithdrawalRequest({
      userId: auth.user.id,
      amountCents: body.amountCents!,
      destinationType: body.destinationType,
      destinationRef: body.destinationRef,
    });
    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (err) {
    if (err instanceof WithdrawalError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not create withdrawal." }, { status: 500 });
  }
}
