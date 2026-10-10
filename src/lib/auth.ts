import { randomBytes } from "node:crypto";
import { execute, newId, nowIso, queryOne } from "./db";
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

  let referredBy: string | null = null;
  if (input.referralCode?.trim()) {
    const referrer = await queryOne<{ id: string }>("SELECT id FROM users WHERE referral_code = ?", [input.referralCode.trim().toUpperCase()]);
    if (referrer) referredBy = referrer.id;
  }

  const passwordHash = await hashPassword(input.password);
  const id = newId();
  const now = nowIso();
  const referralCode = generateReferralCode();

  // No SELECT-then-INSERT: the UNIQUE index on users.email is the arbiter, so a
  // concurrent registration of the same address cannot slip through the gap.
  try {
    await execute(
      `INSERT INTO users (id, email, password_hash, name, role, status, referral_code, referred_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'user', 'active', ?, ?, ?, ?)`,
      [id, email, passwordHash, input.name.trim(), referralCode, referredBy, now, now],
    );
  } catch (error) {
    if (isUniqueViolation(error, "users.email")) {
      throw new AuthError("An account with this email already exists.", "EMAIL_TAKEN", 409);
    }
    throw error;
  }

  return { id, email, name: input.name.trim(), role: "user", status: "active", referralCode, createdAt: now };
}

function isUniqueViolation(error: unknown, target: string): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("UNIQUE constraint failed") && message.includes(target);
}

export async function authenticateUser(email: string, password: string): Promise<LocalUser> {
  const row = await queryOne<{
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

export async function getUserById(id: string): Promise<LocalUser | null> {
  const row = await queryOne<{
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
