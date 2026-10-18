import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { PayoutsView, type PayoutRow } from "@/components/sites/spl-trading/cabinet/payouts-view";
import { requirePageUser } from "@/lib/page-user";
import { listWithdrawals } from "@/lib/withdrawals";
import { getDepositEligibility } from "@/lib/deposit-eligibility";
import { getUserCashBalanceCents } from "@/lib/ledger";
import { getWithdrawalFeeBps, isFeatureEnabled, MINIMUM_DEPOSIT_CENTS } from "@/lib/flags";
import { MIN_WITHDRAWAL_CENTS } from "@/lib/withdrawal-create";

export const metadata: Metadata = {
  title: "Payouts",
  description: "Submit and track manually reviewed BEP-20 USDT payout requests, fees, statuses, and BSC settlement receipts.",
};

export default async function PayoutsPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  const [withdrawals, eligibility, balanceCents, withdrawalsEnabled, depositsEnabled, feeBps] = await Promise.all([
    listWithdrawals(user.id),
    getDepositEligibility(user.id),
    getUserCashBalanceCents(user.id),
    isFeatureEnabled("withdrawals_enabled"),
    isFeatureEnabled("deposits_enabled"),
    getWithdrawalFeeBps(),
  ]);
  const rows: PayoutRow[] = withdrawals.map((request) => ({
    id: request.id,
    reference: request.internalRef,
    amountCents: request.amountCents,
    feeCents: request.feeCents,
    netCents: request.netCents,
    status: request.status,
    txHash: request.txHash,
    createdAt: request.createdAt,
  }));

  return (
    <CabinetShell title="Payouts" email={user.email} name={user.name}>
      <PayoutsView
        rows={rows}
        depositsEnabled={depositsEnabled}
        withdrawalsEnabled={withdrawalsEnabled}
        creditedDepositCents={eligibility.creditedCents}
        unlockThresholdCents={MINIMUM_DEPOSIT_CENTS}
        balanceCents={balanceCents}
        minCents={MIN_WITHDRAWAL_CENTS}
        feeBps={feeBps}
      />
    </CabinetShell>
  );
}
