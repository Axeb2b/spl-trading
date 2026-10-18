import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { AccountsView } from "@/components/sites/spl-trading/cabinet/accounts-view";
import { requirePageUser } from "@/lib/page-user";

export const metadata: Metadata = {
  title: "Accounts",
  description: "Payout destination availability and account notes.",
};

export default async function AccountsPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <CabinetShell title="Accounts" email={user.email} name={user.name}>
      <AccountsView />
    </CabinetShell>
  );
}
