import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getDepositOrderById } from "@/lib/deposits";
import { getPaymentDestination } from "@/lib/payment-destination";
import { isFeatureEnabled } from "@/lib/flags";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const order = await getDepositOrderById(id);
  if (!order || order.userId !== auth.user.id) {
    return NextResponse.json({ error: "Deposit not found." }, { status: 404 });
  }
  const openStatuses = new Set(["pending", "awaiting_payment", "confirming"]);
  const beforeExpiry = !order.expiresAt || Date.parse(order.expiresAt) > Date.now();
  const depositsEnabled = await isFeatureEnabled("deposits_enabled");
  const destination = depositsEnabled && openStatuses.has(order.status) && beforeExpiry
    ? await getPaymentDestination()
    : { address: "", network: "BEP20" as const, asset: "USDT" as const, qrDataUrl: null, configured: false };
  return NextResponse.json({ deposit: order, destination });
}
