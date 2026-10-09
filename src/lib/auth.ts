import { randomBytes } from "node:crypto";
import { getDb, newId, nowIso, queryOne } from "./db";
import { hashPassword, verifyPassword } from "./password";

export type LocalUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  status: "active" | "restricted" | "suspended";
  referralCode: string;
  createdAt: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_INPUT" | "EMAIL_TAKEN" | "INVALID_CREDENTIALS" | "ACCOUNT_RESTRICTED",
    public readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
  referralCode?: string;
}): Promise<LocalUser> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new AuthError("Enter a valid email address.", "INVALID_INPUT", 400);
  if (input.password.length < 8) throw new AuthError("Password must be at least 8 characters.", "INVALID_INPUT", 400);

  const existing = queryOne<{ id: string }>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) throw new AuthError("An account with this email already exists.", "EMAIL_TAKEN", 409);

  let referredBy: string | null = null;
  if (input.referralCode?.trim()) {
    const referrer = queryOne<{ id: string }>("SELECT id FROM users WHERE referral_code = ?", [input.referralCode.trim().toUpperCase()]);
    if (referrer) referredBy = referrer.id;
  }

  const passwordHash = await hashPassword(input.password);
  const id = newId();
  const now = nowIso();

  getDb()
    .prepare(
      `INSERT INTO users (id, email, password_hash, name, role, status, referral_code, referred_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'user', 'active', ?, ?, ?, ?)`,
    )
    .run(id, email, passwordHash, input.name.trim(), generateReferralCode(), referredBy, now, now);

  return { id, email, name: input.name.trim(), role: "user", status: "active", referralCode: "", createdAt: now };
}

export async function authenticateUser(email: string, password: string): Promise<LocalUser> {
  const row = queryOne<{
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    password_hash: string;
    referral_code: string;
    created_at: string;
  }>("SELECT id, email, name, role, status, password_hash, referral_code, created_at FROM users WHERE email = ?", [
    email.trim().toLowerCase(),
  ]);

  if (!row) throw new AuthError("Wrong email or password.", "INVALID_CREDENTIALS", 401);

  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) throw new AuthError("Wrong email or password.", "INVALID_CREDENTIALS", 401);

  if (row.status === "suspended") throw new AuthError("This account is suspended.", "ACCOUNT_RESTRICTED", 403);

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === "admin" ? "admin" : "user",
    status: row.status === "restricted" ? "restricted" : "active",
    referralCode: row.referral_code,
    createdAt: row.created_at,
  };
}

export function getUserById(id: string): LocalUser | null {
  const row = queryOne<{
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    referral_code: string;
    created_at: string;
  }>("SELECT id, email, name, role, status, referral_code, created_at FROM users WHERE id = ?", [id]);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === "admin" ? "admin" : "user",
    status: row.status === "active" ? "active" : row.status === "restricted" ? "restricted" : "suspended",
    referralCode: row.referral_code,
    createdAt: row.created_at,
  };
}
