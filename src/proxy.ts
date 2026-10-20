import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Security headers.
 *
 * The live deployment shipped almost none of these — no CSP, no HSTS, no frame
 * protection, no referrer policy, no permissions policy. The reference site
 * sent a full set, so we keep parity and close the gap.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "form-action 'self'",
  "frame-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  return response;
}

const PROTECTED_PREFIXES = [
  "/payins",
  "/payouts",
  "/accounts",
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
    return withSecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !hasSession) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/auth/sign-in", request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/payins/:path*",
    "/payouts/:path*",
    "/accounts/:path*",
    "/onboarding/:path*",
    "/report/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
