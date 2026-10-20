import { NextResponse, type NextRequest } from "next/server";
import { resolveSession, SESSION_COOKIE, type SessionPayload } from "./session";
import { getUserById, type LocalUser } from "./auth";

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return resolveSession(token);
}

export async function getLocalUser(request: NextRequest): Promise<LocalUser | null> {
  const session = await getSessionFromRequest(request);
  if (!session?.userId) return null;
  return getUserById(session.userId);
}

export async function requireAuth(
  request: NextRequest,
): Promise<{ user: LocalUser } | { error: NextResponse }> {
  const user = await getLocalUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  if (user.status === "suspended") {
    return { error: NextResponse.json({ error: "Account suspended." }, { status: 403 }) };
  }
  return { user };
}

export async function requireAdmin(
  request: NextRequest,
): Promise<{ user: LocalUser } | { error: NextResponse }> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth;
  if (auth.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return auth;
}
