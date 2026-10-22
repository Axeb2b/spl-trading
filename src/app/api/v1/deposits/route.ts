import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createDepositOrder, listDepositOrders, DepositError } from "@/lib/deposits";
import { isFeatureEnabled, getDepositMinCents, getDepositMaxCents } from "@/lib/flags";
import { getPaymentDestination } from "@/lib/payment-destination";
import { emitAdminEvent, emitEvent } from "@/lib/realtime/events";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const destination = await getPaymentDestination();
  return NextResponse.json({
    deposits: await listDepositOrders(auth.user.id),
    destination,
    limits: { minCents: await getDepositMinCents(), maxCents: await getDepositMaxCents() },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  if (!(await isFeatureEnabled("deposits_enabled"))) {
    return NextResponse.json(
      { error: "Deposits are currently disabled. Contact support." },
      { status: 403 },
    );
  }

  let body: { amountCents?: number; currency?: string; network?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Number.isInteger(body.amountCents) || (body.amountCents ?? 0) <= 0) {
    return NextResponse.json({ error: "amountCents must be a positive integer." }, { status: 400 });
  }

  try {
    const order = await createDepositOrder({
      userId: auth.user.id,
      amountCents: body.amountCents!,
      currency: body.currency,
      network: body.network,
    });
    const destination = await getPaymentDestination();
    // The realtime stream announces the new order; the cabinet refreshes from it.
    await emitEvent(auth.user.id, "deposit.updated", { id: order.id, status: order.status });
    await emitEvent(auth.user.id, "overview.updated", { reason: "deposit_created" });
    await emitAdminEvent("admin.queue.updated", {
      queue: "deposits",
      id: order.id,
      status: order.status,
      action: "create",
    });
    return NextResponse.json({ deposit: order, destination }, { status: 201 });
  } catch (err) {
    if (err instanceof DepositError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not create deposit order." }, { status: 500 });
  }
}
