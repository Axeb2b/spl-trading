import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE, type SessionPayload } from "./session";
import { getUserById, type LocalUser } from "./auth";

export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return readSessionToken(token);
}

export function getLocalUser(request: NextRequest): LocalUser | null {
  const session = getSessionFromRequest(request);
  if (!session?.userId) return null;
  return getUserById(session.userId);
}

export function requireAuth(request: NextRequest): { user: LocalUser } | { error: NextResponse } {
  const user = getLocalUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  if (user.status === "suspended") {
    return { error: NextResponse.json({ error: "Account suspended." }, { status: 403 }) };
  }
  return { user };
}

export function requireAdmin(request: NextRequest): { user: LocalUser } | { error: NextResponse } {
  const auth = requireAuth(request);
  if ("error" in auth) return auth;
  if (auth.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return auth;
}
