import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { OnboardingView } from "@/components/sites/spl-trading/cabinet/onboarding-view";
import { requirePageUser } from "@/lib/page-user";

export const metadata: Metadata = {
  title: "Getting started",
  description: "A practical orientation to deposit orders, account records, fees, and risks.",
};

export default async function OnboardingPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <CabinetShell title="Getting started" email={user.email} name={user.name}>
      <OnboardingView />
    </CabinetShell>
  );
}
