import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";
import { revokeSession } from "@/lib/sessions";

/**
 * Sign-out revokes the session server-side. The live deployment only cleared
 * the cookie, which left the token valid until it expired — replaying it
 * still returned an authenticated session.
 */
export async function POST(): Promise<NextResponse> {
  const store = await cookies();
  const payload = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (payload) await revokeSession(payload.sid);
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
