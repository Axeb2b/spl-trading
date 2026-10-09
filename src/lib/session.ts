import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "spl_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

const SECRET = process.env.SPL_SESSION_SECRET ?? "spl-trading-local-dev-secret";

export type SessionPayload = {
  email: string;
  name: string;
  userId?: string;
  role?: "user" | "admin";
  exp: number;
};

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createSessionToken(
  payload: Pick<SessionPayload, "email" | "name"> & Partial<Pick<SessionPayload, "userId" | "role">>,
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
    const { email, name, userId, role, exp } = parsed as Partial<SessionPayload>;
    if (!email || typeof exp !== "number") return null;
    if (exp < Math.floor(Date.now() / 1000)) return null;
    return {
      email,
      name: name ?? "",
      userId: typeof userId === "string" ? userId : undefined,
      role: role === "admin" ? "admin" : role === "user" ? "user" : undefined,
      exp,
    };
  } catch {
    return null;
  }
}
