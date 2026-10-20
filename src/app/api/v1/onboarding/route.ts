import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getOnboardingState } from "@/lib/onboarding";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const state = await getOnboardingState(auth.user.id);
  return NextResponse.json(state);
}
