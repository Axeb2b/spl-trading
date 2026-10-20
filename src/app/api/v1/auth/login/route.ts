import { NextResponse, type NextRequest } from "next/server";
import { authenticateUser, AuthError } from "@/lib/auth";
import { SESSION_COOKIE, createSessionToken } from "@/lib/session";
import { createSession } from "@/lib/sessions";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const user = await authenticateUser(body.email, body.password);
    // The cookie references a server-side session row, so sign-out can revoke it.
    const session = await createSession(user.id);
    const token = createSessionToken({
      email: user.email,
      name: user.name,
      userId: user.id,
      role: user.role,
      sid: session.sid,
    });
    const response = NextResponse.json({ success: true, userId: user.id, role: user.role });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Sign-in failed." }, { status: 500 });
  }
}
