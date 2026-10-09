import type { Metadata } from "next";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { DashboardCards, type DashboardSummary } from "@/components/sites/spl-trading/cabinet/dashboard-cards";
import { HomeStats, type HomeCounts } from "@/components/sites/spl-trading/cabinet/home-stats";
import { requirePageUser } from "@/lib/page-user";
import { getUserCashBalanceCents } from "@/lib/ledger";
import { listDepositOrders } from "@/lib/deposits";
import { listWithdrawals } from "@/lib/withdrawals";

export const metadata: Metadata = {
  title: "Home",
  description: "Trader portal for balances, payouts and settlements",
};

export default async function Home() {
  const user = await requirePageUser();

  if (!user) {
    const { SignInForm } = await import("@/components/sites/spl-trading/sign-in-form");
    return (
      <SignInForm headLinkText="New here?" headLinkCta="Sign Up" headLinkTo="/auth/sign-up" />
    );
  }

  const deposits = listDepositOrders(user.id);
  const withdrawals = listWithdrawals(user.id);
  const credited = deposits.filter((order) => order.status === "credited");

  const summary: DashboardSummary = {
    availableCashCents: getUserCashBalanceCents(user.id),
    depositedPrincipalCents: credited.reduce((sum, order) => sum + order.amountCents, 0),
    pendingWithdrawalCents: withdrawals
      .filter((w) => w.status === "pending" || w.status === "approved" || w.status === "processing")
      .reduce((sum, w) => sum + w.amountCents, 0),
    hasCreditedDeposit: credited.length > 0,
    transactionCount: credited.length + withdrawals.length,
  };

  const counts: HomeCounts = {
    totalPayins: deposits.length,
    totalPayouts: withdrawals.length,
    totalTransactions: summary.transactionCount,
    activePayins: deposits.filter((d) => d.status !== "credited" && d.status !== "expired").length,
    successfulPayins: credited.length,
    pendingPayouts: withdrawals.filter(
      (w) => w.status === "pending" || w.status === "approved" || w.status === "processing",
    ).length,
    completedPayouts: withdrawals.filter((w) => w.status === "completed").length,
    creditedCents: summary.depositedPrincipalCents,
  };

  return (
    <CabinetShell title="Home" email={user.email} name={user.name}>
      <DashboardCards summary={summary} />
      <HomeStats counts={counts} />
    </CabinetShell>
  );
}
