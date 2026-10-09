import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { queryAll } from "@/lib/db";
import { creditVerifiedDeposit, rejectDeposit, DepositError } from "@/lib/deposits";
import { audit } from "@/lib/audit";
import { isFeatureEnabled } from "@/lib/flags";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = requireAdmin(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const rows = status
    ? queryAll<Record<string, unknown>>("SELECT * FROM deposit_orders WHERE status = ? ORDER BY created_at DESC LIMIT 200", [status])
    : queryAll<Record<string, unknown>>("SELECT * FROM deposit_orders ORDER BY created_at DESC LIMIT 200");

  return NextResponse.json({ deposits: rows });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = requireAdmin(request);
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
      if (!isFeatureEnabled("deposits_enabled")) {
        return NextResponse.json({ error: "Deposits feature is disabled." }, { status: 403 });
      }
      const result = creditVerifiedDeposit({
        depositId: body.depositId,
        verifiedBy: auth.user.id,
        providerRef: body.providerRef,
        idempotencyKey: `admin-verify-${body.depositId}`,
      });
      audit({ actorId: auth.user.id, actorRole: "admin", action: "deposit.verify", targetType: "deposit", targetId: body.depositId, metadata: { alreadyCredited: result.alreadyCredited } });
      return NextResponse.json({ success: true, alreadyCredited: result.alreadyCredited });
    }
    if (body.action === "reject") {
      rejectDeposit(body.depositId, auth.user.id, body.reason ?? "Rejected by admin");
      audit({ actorId: auth.user.id, actorRole: "admin", action: "deposit.reject", targetType: "deposit", targetId: body.depositId });
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
