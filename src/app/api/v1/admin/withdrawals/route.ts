import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { queryAll } from "@/lib/db";
import { approveWithdrawal, startProcessing, completeWithdrawal, rejectWithdrawal, WithdrawalError } from "@/lib/withdrawals";
import { audit } from "@/lib/audit";
import { isFeatureEnabled } from "@/lib/flags";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const rows = await queryAll<Record<string, unknown>>("SELECT * FROM withdrawal_requests ORDER BY created_at DESC LIMIT 200");
  return NextResponse.json({ withdrawals: rows });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  let body: { action?: string; withdrawalId?: string; txHash?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.withdrawalId || !body.action) {
    return NextResponse.json({ error: "action and withdrawalId are required." }, { status: 400 });
  }

  try {
    if (!(await isFeatureEnabled("withdrawals_enabled"))) {
      return NextResponse.json({ error: "Withdrawals feature is disabled." }, { status: 403 });
    }
    switch (body.action) {
      case "approve":
        await approveWithdrawal(body.withdrawalId, auth.user.id);
        break;
      case "start_processing":
        await startProcessing(body.withdrawalId);
        break;
      case "complete":
        if (!body.txHash) return NextResponse.json({ error: "txHash required to complete." }, { status: 400 });
        await completeWithdrawal(body.withdrawalId, body.txHash);
        break;
      case "reject":
        await rejectWithdrawal(body.withdrawalId, auth.user.id, body.reason ?? "Rejected by admin");
        break;
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    await audit({ actorId: auth.user.id, actorRole: "admin", action: `withdrawal.${body.action}`, targetType: "withdrawal", targetId: body.withdrawalId });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof WithdrawalError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
