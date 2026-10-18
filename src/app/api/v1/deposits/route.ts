import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createDepositOrder, listDepositOrders, DepositError } from "@/lib/deposits";
import { isFeatureEnabled, getDepositMinCents, getDepositMaxCents, getBep20Address } from "@/lib/flags";
import { getPaymentDestination } from "@/lib/payment-destination";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;
  const depositsEnabled = await isFeatureEnabled("deposits_enabled");
  const receivingAddress = depositsEnabled ? await getBep20Address() : "";
  const destination = {
    address: "",
    network: "BEP20" as const,
    asset: "USDT" as const,
    qrDataUrl: null,
    configured: /^0x[a-fA-F0-9]{40}$/.test(receivingAddress),
  };
  return NextResponse.json({
    deposits: await listDepositOrders(auth.user.id),
    destination,
    depositsEnabled,
    limits: { minCents: await getDepositMinCents(), maxCents: await getDepositMaxCents() },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  if (!(await isFeatureEnabled("deposits_enabled"))) {
    return NextResponse.json(
      { error: "Deposit orders are not enabled for this deployment." },
      { status: 403 },
    );
  }

  const destination = await getPaymentDestination();
  if (!destination.configured) {
    return NextResponse.json({ error: "A valid BEP-20 receiving address is not configured." }, { status: 503 });
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
    return NextResponse.json({ deposit: order, destination }, { status: 201 });
  } catch (err) {
    if (err instanceof DepositError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Could not create deposit order." }, { status: 500 });
  }
}
