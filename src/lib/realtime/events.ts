import { execute, nowIso, queryAll, queryOne } from "@/lib/db";

export type AppEventType =
  | "deposit.updated"
  | "withdrawal.updated"
  | "transaction.created"
  | "notification.created"
  | "onboarding.updated"
  | "overview.updated"
  | "admin.queue.updated";

export type AppEvent = {
  id: number;
  type: string;
  payload: unknown;
  createdAt: string;
};

/**
 * Writes an event into the realtime log.
 *
 * Callers write the event in the SAME batch as the state change it describes,
 * so a committed change can never be missing its notification.
 */
export async function emitEvent(
  userId: string | null,
  type: AppEventType,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await execute("INSERT INTO events (user_id, type, payload, created_at) VALUES (?, ?, ?, ?)", [
    userId,
    type,
    JSON.stringify(payload),
    nowIso(),
  ]);
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

/** Newest-first page of a user's events, newest id first (used for history). */
export async function readEvents(
  userId: string,
  afterId: number,
  limit = 20,
): Promise<AppEvent[]> {
  const rows = await queryAll<{
    id: number;
    type: string;
    payload: string;
    created_at: string;
  }>(
    "SELECT id, type, payload, created_at FROM events WHERE user_id = ? AND id > ? ORDER BY id ASC LIMIT ?",
    [userId, afterId, limit],
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    payload: safeParse(row.payload),
    createdAt: row.created_at,
  }));
}

/** Removes events older than the cutoff (called from the scheduled worker). */
export async function pruneEvents(cutoffIso: string): Promise<number> {
  const result = await execute("DELETE FROM events WHERE created_at < ?", [cutoffIso]);
  return result.changes;
}

/** Most recent event id for a user — used to resume a stream. */
export async function lastEventId(userId: string): Promise<number> {
  const row = await queryOne<{ id: number | null }>(
    "SELECT MAX(id) AS id FROM events WHERE user_id = ?",
    [userId],
  );
  return row?.id ?? 0;
}
