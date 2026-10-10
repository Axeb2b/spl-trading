import type { Metadata } from "next";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { DashboardCards, type DashboardSummary } from "@/components/sites/spl-trading/cabinet/dashboard-cards";
import { HomeStats, type HomeCounts } from "@/components/sites/spl-trading/cabinet/home-stats";
import { Landing } from "@/components/sites/spl-trading/public/landing";
import { PublicShell } from "@/components/sites/spl-trading/public/public-shell";
import { SEO } from "@/components/sites/spl-trading/public/seo";
import { requirePageUser } from "@/lib/page-user";
import { getUserCashBalanceCents } from "@/lib/ledger";
import { listDepositOrders } from "@/lib/deposits";
import { listWithdrawals } from "@/lib/withdrawals";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requirePageUser();

  if (user) {
    return {
      title: "Home",
      description: "Trader portal for balances, payouts and settlements",
    };
  }

  return SEO.default({
    title: "Deposits, payouts and reports in one cabinet",
    description:
      "SPL Trading is a cabinet for funding an account with USDT, paying out to accounts you control, and reading every movement. No promised returns.",
    path: "/",
  });
}

export default async function Home() {
  const user = await requirePageUser();

  if (!user) {
    return (
      <PublicShell>
        <Landing />
      </PublicShell>
    );
  }

  const deposits = await listDepositOrders(user.id);
  const withdrawals = await listWithdrawals(user.id);
  const credited = deposits.filter((order) => order.status === "credited");

  const summary: DashboardSummary = {
    availableCashCents: await getUserCashBalanceCents(user.id),
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
