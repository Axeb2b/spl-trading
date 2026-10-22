import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { queryAll } from "@/lib/db";
import { creditVerifiedDeposit, rejectDeposit, DepositError } from "@/lib/deposits";
import { audit } from "@/lib/audit";
import { emitAdminEvent, emitEvent } from "@/lib/realtime/events";
import { getDepositOrderById } from "@/lib/deposits";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const rows = status
    ? await queryAll<Record<string, unknown>>("SELECT * FROM deposit_orders WHERE status = ? ORDER BY created_at DESC LIMIT 200", [status])
    : await queryAll<Record<string, unknown>>("SELECT * FROM deposit_orders ORDER BY created_at DESC LIMIT 200");

  return NextResponse.json({ deposits: rows });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  let body: { action?: string; depositId?: string; providerRef?: string; reason?: string };
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
      // Admin settlement is deliberately NOT gated by the customer-facing
      // feature flag: pausing new deposits must never strand the review queue
      // (or the Telegram bot, which settles through this same route).
      const result = await creditVerifiedDeposit({
        depositId: body.depositId,
        verifiedBy: auth.user.id,
        providerRef: body.providerRef,
      });
      await audit({ actorId: auth.user.id, actorRole: "admin", action: "deposit.verify", targetType: "deposit", targetId: body.depositId, metadata: { alreadyCredited: result.alreadyCredited } });
      // The owner sees the credit land without a reload.
      const order = await getDepositOrderById(body.depositId);
      if (order) {
        await emitEvent(order.userId, "deposit.updated", { id: order.id, status: order.status });
        await emitEvent(order.userId, "overview.updated", { reason: "deposit_credited" });
        await emitAdminEvent("admin.queue.updated", { queue: "deposits", id: order.id, status: order.status, action: "verify" });
      }
      return NextResponse.json({ success: true, alreadyCredited: result.alreadyCredited });
    }
    if (body.action === "reject") {
      await rejectDeposit(body.depositId, auth.user.id, body.reason ?? "Rejected by admin");
      await audit({ actorId: auth.user.id, actorRole: "admin", action: "deposit.reject", targetType: "deposit", targetId: body.depositId });
      const rejected = await getDepositOrderById(body.depositId);
      if (rejected) {
        await emitEvent(rejected.userId, "deposit.updated", { id: rejected.id, status: rejected.status });
        await emitAdminEvent("admin.queue.updated", { queue: "deposits", id: rejected.id, status: rejected.status, action: "reject" });
      }
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
