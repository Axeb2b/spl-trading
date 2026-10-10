import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session";

const PROTECTED_PREFIXES = [
  "/payins",
  "/payouts",
  "/accounts",
  "/trading",
  "/onboarding",
  "/report",
  "/admin",
];

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  // Validate the signature, not just presence: a junk cookie named spl_session
  // must not pass the guard. Real authorization still happens per-route in
  // requireAuth/requireAdmin; this only controls which page renders.
  const hasSession = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value) !== null;

  const isAuthPage = pathname.startsWith("/auth/");
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/payins/:path*",
    "/payouts/:path*",
    "/accounts/:path*",
    "/trading/:path*",
    "/onboarding/:path*",
    "/report/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
