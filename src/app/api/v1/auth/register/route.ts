import { NextResponse, type NextRequest } from "next/server";
import { registerUser, AuthError } from "@/lib/auth";
import { SESSION_COOKIE, createSessionToken } from "@/lib/session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { email?: string; password?: string; name?: string; referralCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "Email, password, and name are required." }, { status: 400 });
  }

  try {
    const user = await registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
      referralCode: body.referralCode,
    });

    const token = createSessionToken({ email: user.email, name: user.name, userId: user.id, role: user.role });
    const response = NextResponse.json({ success: true, userId: user.id });
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
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
