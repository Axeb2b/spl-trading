import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = requireAuth(request);
  if ("error" in auth) return auth.error;
  const { user } = auth;
  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    createdAt: user.createdAt,
  });
}
