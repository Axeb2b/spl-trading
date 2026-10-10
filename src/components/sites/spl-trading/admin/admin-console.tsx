"use client";

import { useState } from "react";
import { LayoutDashboard, Settings2, Wallet, ArrowUpFromLine, ShieldCheck, TrendingUp } from "lucide-react";
import { AdminOverview } from "./admin-overview";
import { AdminConfig } from "./admin-config";
import { AdminDeposits } from "./admin-deposits";
import { AdminWithdrawals } from "./admin-withdrawals";
import { AdminTrading } from "./admin-trading";

type TabKey = "overview" | "config" | "deposits" | "withdrawals" | "trading";

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "config", label: "Configuration", icon: Settings2 },
  { key: "deposits", label: "Deposits", icon: Wallet },
  { key: "withdrawals", label: "Payouts", icon: ArrowUpFromLine },
  { key: "trading", label: "Trading", icon: TrendingUp },
];

export function AdminConsole() {
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        <span className="ml-2 mr-1 hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:flex">
          <ShieldCheck className="size-3.5" aria-hidden /> Staff
        </span>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? <AdminOverview /> : null}
      {tab === "config" ? <AdminConfig /> : null}
      {tab === "deposits" ? <AdminDeposits /> : null}
      {tab === "withdrawals" ? <AdminWithdrawals /> : null}
      {tab === "trading" ? <AdminTrading /> : null}
    </div>
  );
}