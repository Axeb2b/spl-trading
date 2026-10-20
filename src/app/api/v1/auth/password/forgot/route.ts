import { NextResponse, type NextRequest } from "next/server";
import { newId, nowIso, execute } from "@/lib/db";
import { getLocalUser } from "@/lib/api-auth";

/**
 * Password recovery is a support handoff, not a self-service code flow.
 *
 * There is deliberately no `verify`/`reset` endpoint: shipping dead handlers
 * would repeat the exact defect the previous build had — a form that claimed
 * to send a one-time code and then went nowhere. Support performs the reset
 * out of band after verifying the account holder.
 *
 * The response never reveals whether an account exists.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const user = await getLocalUser(request);
  const id = newId();
  await execute(
    "INSERT INTO support_requests (id, user_id, email, message, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)",
    [id, user?.id ?? null, email, body.message?.slice(0, 2000) ?? "", nowIso()],
  );

  return NextResponse.json(
    {
      requestId: id,
      submittedAt: nowIso(),
      message:
        "If an account exists for that address, support will reply with recovery instructions.",
    },
    { status: 202 },
  );
}
