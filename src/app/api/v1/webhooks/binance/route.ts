import { NextResponse, type NextRequest } from "next/server";

/**
 * Binance Pay webhook endpoint (stub).
 *
 * This endpoint intentionally rejects all events until a real Binance Pay
 * Merchant integration is configured with a verified webhook signing secret.
 * No automatic crediting occurs here. When merchant credentials are provided,
 * this route must:
 *   1. Verify the HMAC signature over the raw body using the merchant webhook key.
 *   2. Parse the event and locate the matching internal deposit order by merchantTradeNo.
 *   3. Confirm order status / amount / currency against the provider's API (not just the payload).
 *   4. Call creditVerifiedDeposit() with a deterministic idempotency key derived from the provider event ID.
 *   5. Acknowledge per Binance's required response format.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  await request.text().catch(() => "");
  return NextResponse.json(
    {
      received: false,
      message: "Binance Pay merchant integration is not configured. No events are processed.",
    },
    { status: 503 },
  );
}
