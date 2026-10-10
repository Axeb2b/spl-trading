import { getSession } from "./session";
import { getUserById, type LocalUser } from "./auth";

/**
 * Resolves the signed-in local user for a server-rendered page.
 *
 * Returns null when there is no valid session, when the session carries no
 * `userId` (a legacy proxy-minted cookie had none, so it could never satisfy
 * `requireAuth`), or when the account is suspended.
 *
 * Server-only: imports `cookies()` via ./session.
 */
export async function requirePageUser(): Promise<LocalUser | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await getUserById(session.userId);
  if (!user || user.status === "suspended") return null;

  return user;
}
