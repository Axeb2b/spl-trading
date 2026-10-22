import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { resolveSession, SESSION_COOKIE, type SessionPayload } from "./session";
import { getUserById, type LocalUser } from "./auth";

/**
 * Machine identity used by the Telegram admin bot. It is seeded by
 * `004_service_admin.sql` and can only be assumed with SPL_ADMIN_API_KEY;
 * its password hash is a placeholder that never verifies.
 */
const SERVICE_ADMIN_USER_ID = "system:telegram-bot";

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

/** The service key travels either as `x-admin-api-key` or a Bearer token. */
function readServiceKey(request: NextRequest): string | null {
  const headerKey = request.headers.get("x-admin-api-key")?.trim();
  if (headerKey) return headerKey;
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match ? match[1].trim() || null : null;
}

function serviceKeyMatches(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireAdmin(
  request: NextRequest,
): Promise<{ user: LocalUser } | { error: NextResponse }> {
  const serviceKey = readServiceKey(request);
  if (serviceKey !== null) {
    const expected = process.env.SPL_ADMIN_API_KEY?.trim();
    if (!expected || !serviceKeyMatches(serviceKey, expected)) {
      return { error: NextResponse.json({ error: "Invalid admin API key." }, { status: 401 }) };
    }
    const serviceUser = await getUserById(SERVICE_ADMIN_USER_ID);
    if (!serviceUser || serviceUser.role !== "admin" || serviceUser.status !== "active") {
      return {
        error: NextResponse.json({ error: "Service admin identity unavailable." }, { status: 503 }),
      };
    }
    return { user: serviceUser };
  }

  const auth = await requireAuth(request);
  if ("error" in auth) return auth;
  if (auth.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return auth;
}
