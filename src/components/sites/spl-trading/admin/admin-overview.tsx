"use client";

import { useEffect, useState } from "react";
import { Users, Wallet, ArrowUpFromLine, Clock, Gift, TrendingUp } from "lucide-react";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";

type Overview = {
  users: number;
  depositsCreditedTotalCents: number;
  depositsCreditedCount: number;
  depositsPendingCount: number;
  withdrawalsPendingCount: number;
  referralRewardsPendingCount: number;
  referralRewardsPendingCents: number;
};

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/overview")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json: Overview) => active && setData(json))
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="text-sm text-red-600 dark:text-red-400">Could not load overview: {error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading overview…</p>;

  return (
    <StatCardGrid columns={3}>
      <StatCard label="Accounts" value={data.users.toLocaleString()} icon={Users} sublabel="registered users" />
      <StatCard
        label="Deposits credited"
        value={usd(data.depositsCreditedTotalCents)}
        icon={Wallet}
        tone="positive"
        sublabel={`${data.depositsCreditedCount} credited orders`}
      />
      <StatCard
        label="Deposits in flight"
        value={data.depositsPendingCount.toLocaleString()}
        icon={Clock}
        tone={data.depositsPendingCount > 0 ? "negative" : "muted"}
        sublabel="awaiting verification"
      />
      <StatCard
        label="Payouts queued"
        value={data.withdrawalsPendingCount.toLocaleString()}
        icon={ArrowUpFromLine}
        tone={data.withdrawalsPendingCount > 0 ? "negative" : "muted"}
        sublabel="pending / approved / processing"
      />
      <StatCard
        label="Referral rewards"
        value={data.referralRewardsPendingCount.toLocaleString()}
        icon={Gift}
        sublabel={`${usd(data.referralRewardsPendingCents)} pending pay-out`}
      />
      <StatCard
        label="Platform volume"
        value={usd(data.depositsCreditedTotalCents)}
        icon={TrendingUp}
        tone="positive"
        sublabel="lifetime credited deposits"
      />
    </StatCardGrid>
  );
}