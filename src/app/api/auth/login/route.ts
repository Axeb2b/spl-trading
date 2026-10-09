import { NextResponse } from "next/server";

/**
 * Retired: legacy passthrough to the original third-party service.
 *
 * This handler used to forward submitted email/password to a live production
 * host (spoofed User-Agent plus forged origin/referer headers) and mint a
 * local session from the response. That leaked real user credentials off-box
 * on every failed local sign-in, and the cookie it minted carried no `userId`,
 * so the resulting session could never satisfy `requireAuth` on the v1 API.
 *
 * Local sign-in is handled entirely by `POST /api/v1/auth/login`, which
 * authenticates against the local SQLite users table and issues a session
 * containing `userId` + `role`.
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: "This endpoint has been retired. Sign in through POST /api/v1/auth/login.",
    },
    { status: 410 },
  );
}
