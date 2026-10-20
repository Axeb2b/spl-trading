import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { PayoutsView, type PayoutRow } from "@/components/sites/spl-trading/cabinet/payouts-view";
import { requirePageUser } from "@/lib/page-user";
import { listWithdrawals } from "@/lib/withdrawals";

export const metadata: Metadata = {
  title: "Payouts",
  description: "Track outgoing payout transactions",
};

export default async function PayoutsPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  const rows: PayoutRow[] = (await listWithdrawals(user.id)).map((request) => ({
    reference: request.internalRef,
    amountCents: request.amountCents,
    feeCents: request.feeCents,
    status: request.status,
    createdAt: request.createdAt,
  }));

  return (
    <CabinetShell title="Payouts" email={user.email} name={user.name} role={user.role}>
      <PayoutsView rows={rows} />
    </CabinetShell>
  );
}
