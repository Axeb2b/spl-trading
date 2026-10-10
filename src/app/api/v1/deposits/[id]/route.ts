import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getDepositOrderById } from "@/lib/deposits";
import { getPaymentDestination } from "@/lib/payment-destination";

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
  const destination = await getPaymentDestination();
  return NextResponse.json({ deposit: order, destination });
}
