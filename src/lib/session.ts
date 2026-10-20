import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { queryOne } from "@/lib/db";

export const SESSION_COOKIE = "spl_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

const SECRET = process.env.SPL_SESSION_SECRET ?? "spl-trading-local-dev-secret";

export type SessionPayload = {
  email: string;
  name: string;
  userId?: string;
  role?: "user" | "admin";
  /** Server-side session id — the row in `sessions` that authorises this cookie. */
  sid?: string;
  exp: number;
};

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return resolveSession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Resolves a cookie token to a session.
 *
 * The cookie is signed, but the signature alone is not enough: the session row
 * is what makes sign-out revoke access. A token without a `sid` predates
 * server-side sessions and is rejected, so a stale cookie cannot outlive the
 * change.
 */
export async function resolveSession(token: string | undefined): Promise<SessionPayload | null> {
  const payload = readSessionToken(token);
  if (!payload) return null;
  if (!payload.sid) return null;

  const row = await queryOne<{ id: string; expires_at: string; revoked_at: string | null }>(
    "SELECT id, expires_at, revoked_at FROM sessions WHERE id = ?",
    [payload.sid],
  );
  if (!row) return null;
  if (row.revoked_at) return null;
  if (Date.parse(row.expires_at) <= Date.now()) return null;
  return payload;
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function newSessionId(): string {
  return randomBytes(24).toString("hex");
}

export function createSessionToken(
  payload: Pick<SessionPayload, "email" | "name" | "sid"> &
    Partial<Pick<SessionPayload, "userId" | "role">>,
  ttlSec: number = SESSION_TTL_SEC,
): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const { email, name, userId, role, sid, exp } = parsed as Partial<SessionPayload>;
    if (!email || typeof exp !== "number") return null;
    if (exp < Math.floor(Date.now() / 1000)) return null;
    return {
      email,
      name: name ?? "",
      userId: typeof userId === "string" ? userId : undefined,
      role: role === "admin" ? "admin" : role === "user" ? "user" : undefined,
      sid: typeof sid === "string" ? sid : undefined,
      exp,
    };
  } catch {
    return null;
  }
}
