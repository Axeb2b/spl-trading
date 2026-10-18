import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { queryAll } from "@/lib/db";
import { creditVerifiedDeposit, rejectDeposit, DepositError } from "@/lib/deposits";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const rows = status
    ? await queryAll<Record<string, unknown>>("SELECT d.*, u.email AS user_email, u.name AS user_name FROM deposit_orders d JOIN users u ON u.id = d.user_id WHERE d.status = ? ORDER BY d.created_at DESC LIMIT 200", [status])
    : await queryAll<Record<string, unknown>>("SELECT d.*, u.email AS user_email, u.name AS user_name FROM deposit_orders d JOIN users u ON u.id = d.user_id ORDER BY d.created_at DESC LIMIT 200");

  return NextResponse.json({ deposits: rows });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  let body: { action?: string; depositId?: string; providerRef?: string; paymentTimestamp?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.depositId || !body.action) {
    return NextResponse.json({ error: "action and depositId are required." }, { status: 400 });
  }

  try {
    if (body.action === "verify") {
      if (!body.providerRef || !/^0x[a-fA-F0-9]{64}$/.test(body.providerRef)) {
        return NextResponse.json({ error: "A valid BSC transaction hash is required for deposit verification." }, { status: 400 });
      }
      if (!body.paymentTimestamp || !Number.isFinite(Date.parse(body.paymentTimestamp))) {
        return NextResponse.json({ error: "Enter the on-chain BSC payment timestamp before verifying." }, { status: 400 });
      }
      const result = await creditVerifiedDeposit({
        depositId: body.depositId,
        verifiedBy: auth.user.id,
        providerRef: body.providerRef,
        paymentTimestamp: body.paymentTimestamp,
      });
      await audit({ actorId: auth.user.id, actorRole: "admin", action: "deposit.verify", targetType: "deposit", targetId: body.depositId, metadata: { alreadyCredited: result.alreadyCredited, providerRef: body.providerRef, paymentTimestamp: body.paymentTimestamp } });
      return NextResponse.json({ success: true, alreadyCredited: result.alreadyCredited });
    }
    if (body.action === "reject") {
      if ((body.reason ?? "").trim().length < 5) {
        return NextResponse.json({ error: "A short reason is required to reject a deposit." }, { status: 400 });
      }
      await rejectDeposit(body.depositId, auth.user.id, body.reason!.trim());
      await audit({ actorId: auth.user.id, actorRole: "admin", action: "deposit.reject", targetType: "deposit", targetId: body.depositId });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    if (err instanceof DepositError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
