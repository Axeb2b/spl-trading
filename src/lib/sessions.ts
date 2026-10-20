import { execute, nowIso, queryOne } from "@/lib/db";
import { newSessionId } from "@/lib/session";

const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

/**
 * Server-side session records.
 *
 * The cookie carries a signed payload that references one of these rows. A
 * revoked row invalidates the cookie immediately, so sign-out actually ends
 * the session instead of only clearing the browser's copy.
 */
export async function createSession(userId: string | null): Promise<{ sid: string; expiresAt: string }> {
  const sid = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000).toISOString();
  await execute(
    "INSERT INTO sessions (id, user_id, created_at, expires_at, revoked_at) VALUES (?, ?, ?, ?, NULL)",
    [sid, userId, nowIso(), expiresAt],
  );
  return { sid, expiresAt };
}

export async function revokeSession(sid: string | null | undefined): Promise<boolean> {
  if (!sid) return false;
  const result = await execute(
    "UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
    [nowIso(), sid],
  );
  return result.changes > 0;
}

export async function revokeAllSessions(userId: string): Promise<number> {
  const result = await execute(
    "UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
    [nowIso(), userId],
  );
  return result.changes;
}

export async function isSessionActive(sid: string): Promise<boolean> {
  const row = await queryOne<{ expires_at: string; revoked_at: string | null }>(
    "SELECT expires_at, revoked_at FROM sessions WHERE id = ?",
    [sid],
  );
  if (!row) return false;
  if (row.revoked_at) return false;
  return Date.parse(row.expires_at) > Date.now();
}

/** Housekeeping — removes rows that expired more than a day ago. */
export async function pruneSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = await execute("DELETE FROM sessions WHERE expires_at < ?", [cutoff]);
  return result.changes;
}
