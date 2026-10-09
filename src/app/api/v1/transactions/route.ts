import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserLedgerEntries } from "@/lib/ledger";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100") || 100, 500);

  return NextResponse.json({ entries: getUserLedgerEntries(auth.user.id, limit) });
}
