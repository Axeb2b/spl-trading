import type { Metadata } from "next";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { DashboardCards } from "@/components/sites/spl-trading/cabinet/dashboard-cards";
import { DepositUnlockView } from "@/components/sites/spl-trading/cabinet/deposit-unlock-view";
import { HomeStats, type HomeCounts } from "@/components/sites/spl-trading/cabinet/home-stats";
import { RecentActivity, type ActivityItem } from "@/components/sites/spl-trading/cabinet/recent-activity";
import { Landing } from "@/components/sites/spl-trading/public/landing";
import { PublicShell } from "@/components/sites/spl-trading/public/public-shell";
import { requirePageUser } from "@/lib/page-user";
import { getUserCashBalanceCents } from "@/lib/ledger";
import { listDepositOrders } from "@/lib/deposits";
import { listWithdrawals } from "@/lib/withdrawals";
import { isFeatureEnabled } from "@/lib/flags";
import { getDepositEligibility } from "@/lib/deposit-eligibility";
import { depositStatus, withdrawalStatus } from "@/components/ui/status-pill";

export async function generateMetadata(): Promise<Metadata> {
  const user = await requirePageUser();

  if (user) {
    return {
      title: "Overview",
      description: "Review account balance, deposit and payout activity, and transaction records.",
    };
  }

  return {
    title: "A clearer view of deposits and payouts",
    description:
      "SPL Trading is a cabinet for USDT deposit orders, payout activity, and account records. Fees and risks are explained upfront; no return is promised.",
  };
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

  const [eligibility, depositsEnabled] = await Promise.all([
    getDepositEligibility(user.id),
    isFeatureEnabled("deposits_enabled"),
  ]);

  if (!eligibility.eligible) {
    return (
      <CabinetShell title="Overview" email={user.email} name={user.name}>
        <DepositUnlockView
          creditedCents={eligibility.creditedCents}
          thresholdCents={eligibility.thresholdCents}
          depositsEnabled={depositsEnabled}
        />
      </CabinetShell>
    );
  }

  const [deposits, withdrawals, availableCashCents] = await Promise.all([
    listDepositOrders(user.id),
    listWithdrawals(user.id),
    getUserCashBalanceCents(user.id),
  ]);

  const credited = deposits.filter((order) => order.status === "credited");
  const pendingWithdrawals = withdrawals.filter(
    (withdrawal) =>
      withdrawal.status === "pending" ||
      withdrawal.status === "approved" ||
      withdrawal.status === "processing",
  );

  const summary = {
    availableCashCents,
    depositedPrincipalCents: credited.reduce((sum, order) => sum + order.amountCents, 0),
    pendingWithdrawalCents: pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amountCents, 0),
    hasCreditedDeposit: credited.length > 0,
    transactionCount: deposits.length + withdrawals.length,
  };

  const failedPayins = deposits.filter((order) => order.status === "rejected" || order.status === "expired").length;
  const resolvedPayins = credited.length + failedPayins;
  const counts: HomeCounts = {
    totalPayins: deposits.length,
    totalPayouts: withdrawals.length,
    totalTransactions: summary.transactionCount,
    activePayins: deposits.filter(
      (order) => order.status !== "credited" && order.status !== "expired" && order.status !== "rejected",
    ).length,
    successfulPayins: credited.length,
    failedPayins,
    resolvedPayins,
    pendingPayouts: pendingWithdrawals.length,
    completedPayouts: withdrawals.filter((withdrawal) => withdrawal.status === "completed").length,
    creditedCents: summary.depositedPrincipalCents,
  };

  const recentItems: ActivityItem[] = [
    ...deposits.map((order) => {
      const status = depositStatus(order.status);
      return {
        id: order.id,
        reference: order.internalRef,
        kind: "deposit" as const,
        status: status.label,
        tone: status.tone,
        amountCents: order.amountCents,
        createdAt: order.createdAt,
      };
    }),
    ...withdrawals.map((withdrawal) => {
      const status = withdrawalStatus(withdrawal.status);
      return {
        id: withdrawal.id,
        reference: withdrawal.internalRef,
        kind: "payout" as const,
        status: status.label,
        tone: status.tone,
        amountCents: withdrawal.amountCents,
        createdAt: withdrawal.createdAt,
      };
    }),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5);

  return (
    <CabinetShell title="Overview" email={user.email} name={user.name}>
      <DashboardCards summary={summary} depositsEnabled={depositsEnabled} />
      <div className="mb-6">
        <RecentActivity items={recentItems} />
      </div>
      <HomeStats counts={counts} />
    </CabinetShell>
  );
}
