import { newId, nowIso, execute } from "./db";

export async function audit(input: {
  actorId: string | null;
  actorRole: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await execute(
    `INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      input.actorId,
      input.actorRole,
      input.action,
      input.targetType ?? null,
      input.targetId ?? null,
      JSON.stringify(input.metadata ?? {}),
      nowIso(),
    ],
  );
}
