-- Service identity for the Telegram admin bot.
-- The bot authenticates with SPL_ADMIN_API_KEY; this row exists so audit_logs
-- and the verified_by / reviewed_by foreign keys have a real admin actor.
-- The dummy password_hash can never satisfy a password login.
INSERT OR IGNORE INTO users (
  id, email, password_hash, name, role, status, referral_code, created_at, updated_at
) VALUES (
  'system:telegram-bot',
  'telegram-bot@spl.local',
  '!service-account-no-password!',
  'Telegram Admin Bot',
  'admin',
  'active',
  'TGBNOT',
  '2026-10-22T00:00:00.000Z',
  '2026-10-22T00:00:00.000Z'
);
