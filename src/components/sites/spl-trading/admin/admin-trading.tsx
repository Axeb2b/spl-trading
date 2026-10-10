"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Loader2, BarChart3 } from "lucide-react";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";

type AccountRow = {
  id: string;
  label: string;
  currency: string;
  network: string;
  balance_cents: number;
  status: string;
};

type TradeRow = {
  id: string;
  internal_ref: string;
  side: string;
  symbol: string;
  amount_cents: number;
  fee_cents: number;
  status: string;
};

type Payload = {
  accounts: AccountRow[];
  trades: TradeRow[];
  totals: { accounts: number; balanceCents: number; openTrades: number; volumeCents: number };
};

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusTone(status: string): { tone: StatusTone; label: string } {
  switch (status) {
    case "filled":
      return { tone: "success", label: "Filled" };
    case "pending":
      return { tone: "warning", label: "Pending" };
    case "cancelled":
      return { tone: "neutral", label: "Cancelled" };
    default:
      return { tone: "danger", label: "Rejected" };
  }
}

export function AdminTrading() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/admin/trading")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json: Payload) => active && setData(json))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Loading trading oversight…</p>;

  return (
    <div className="grid gap-6">
      <StatCardGrid columns={4}>
        <StatCard label="Trading accounts" value={String(data.totals.accounts)} icon={Wallet} sublabel="customer accounts" />
        <StatCard label="USDT held" value={usd(data.totals.balanceCents)} icon={TrendingUp} tone="positive" sublabel="total balance" />
        <StatCard label="Open orders" value={String(data.totals.openTrades)} icon={Loader2} tone={data.totals.openTrades > 0 ? "negative" : "muted"} sublabel="pending fills" />
        <StatCard label="Traded volume" value={usd(data.totals.volumeCents)} icon={BarChart3} sublabel="filled orders" />
      </StatCardGrid>

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <header className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Recent trades <span className="font-normal text-slate-400">({data.trades.length})</span>
          </h2>
        </header>
        {data.trades.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No trades yet"
            description="Buy and sell orders placed by customers will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Reference</th>
                  <th className="px-5 py-2.5 font-medium">Side</th>
                  <th className="px-5 py-2.5 font-medium">Pair</th>
                  <th className="px-5 py-2.5 font-medium">Amount</th>
                  <th className="px-5 py-2.5 font-medium">Fee</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.trades.map((trade) => {
                  const s = statusTone(trade.status);
                  return (
                    <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{trade.internal_ref}</td>
                      <td className={`px-5 py-3 font-medium capitalize ${trade.side === "buy" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {trade.side}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{trade.symbol}</td>
                      <td className="px-5 py-3 font-medium tabular-nums text-slate-900 dark:text-slate-100">{usd(trade.amount_cents)}</td>
                      <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-400">{usd(trade.fee_cents)}</td>
                      <td className="px-5 py-3"><StatusPill tone={s.tone} label={s.label} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}