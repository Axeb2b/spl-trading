"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Loader2, Wallet, TrendingUp } from "lucide-react";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Account = {
  id: string;
  label: string;
  currency: string;
  network: string;
  balanceCents: number;
  status: string;
};

type Trade = {
  id: string;
  internalRef: string;
  side: "buy" | "sell";
  symbol: string;
  amountCents: number;
  priceCents: number;
  feeCents: number;
  proceedsCents: number;
  status: "pending" | "filled" | "cancelled" | "rejected";
  createdAt: string;
};

type Summary = { balanceCents: number; openTrades: number; filledTrades: number; volumeCents: number };

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function tradeStatus(status: Trade["status"]): { tone: StatusTone; label: string } {
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

export function TradingView() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [accountsRes, ordersRes] = await Promise.all([
      fetch("/api/v1/trading/accounts"),
      fetch("/api/v1/trading/orders"),
    ]);
    if (!accountsRes.ok) {
      toast.error("Could not load trading accounts");
      return;
    }
    const accountsJson: { accounts: Account[]; summary: Summary } = await accountsRes.json();
    setAccounts(accountsJson.accounts);
    setSummary(accountsJson.summary);
    if (ordersRes.ok) {
      const ordersJson: { trades: Trade[] } = await ordersRes.json();
      setTrades(ordersJson.trades);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const account = accounts?.[0];

  async function placeTrade() {
    if (!account) return;
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/trading/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", accountId: account.id, side, amountCents }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not place order");
        return;
      }
      toast.success(`${side === "buy" ? "Buy" : "Sell"} order placed`);
      await load();
    } catch {
      toast.error("Could not place order");
    } finally {
      setBusy(false);
    }
  }

  async function act(tradeId: string, action: "fill" | "cancel") {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/trading/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tradeId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? `Could not ${action} order`);
        return;
      }
      toast.success(action === "fill" ? "Order filled" : "Order cancelled");
      await load();
    } catch {
      toast.error(`Could not ${action} order`);
    } finally {
      setBusy(false);
    }
  }

  if (!accounts || !summary) return <p className="text-sm text-slate-500">Loading trading desk…</p>;

  return (
    <div className="grid gap-6">
      <StatCardGrid columns={3}>
        <StatCard label="USDT balance" value={usd(summary.balanceCents)} icon={Wallet} tone="positive" sublabel="across trading accounts" />
        <StatCard label="Open orders" value={String(summary.openTrades)} icon={Loader2} tone={summary.openTrades > 0 ? "negative" : "muted"} sublabel="pending fills" />
        <StatCard label="Traded volume" value={usd(summary.volumeCents)} icon={TrendingUp} sublabel={`${summary.filledTrades} filled orders`} />
      </StatCardGrid>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">USDT / USD</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {account?.label} · {account?.currency} on {account?.network} · fee 0.25%
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                  side === s
                    ? s === "buy"
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                )}
              >
                {s === "buy" ? <ArrowDownRight className="size-3.5" aria-hidden /> : <ArrowUpRight className="size-3.5" aria-hidden />}
                {s}
              </button>
            ))}
          </div>
        </header>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Amount (USDT)</label>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm tabular-nums text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <Button type="button" onClick={() => void placeTrade()} disabled={busy} className="h-10">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Place {side} order
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <header className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Order history <span className="font-normal text-slate-400">({trades.length})</span>
          </h2>
        </header>
        {trades.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No trades yet"
            description="Place a buy or sell order above to start a trading history."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Reference</th>
                  <th className="px-5 py-2.5 font-medium">Side</th>
                  <th className="px-5 py-2.5 font-medium">Amount</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trades.map((trade) => {
                  const s = tradeStatus(trade.status);
                  return (
                    <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{trade.internalRef}</td>
                      <td className="px-5 py-3">
                        <span className={cn("font-medium capitalize", trade.side === "buy" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium tabular-nums text-slate-900 dark:text-slate-100">{usd(trade.amountCents)}</td>
                      <td className="px-5 py-3"><StatusPill tone={s.tone} label={s.label} /></td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {trade.status === "pending" ? (
                            <>
                              <Button type="button" size="sm" disabled={busy} onClick={() => void act(trade.id, "fill")}>
                                Fill
                              </Button>
                              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void act(trade.id, "cancel")}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">Settled</span>
                          )}
                        </div>
                      </td>
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
