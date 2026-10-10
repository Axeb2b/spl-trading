"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { StatusPill, depositStatus } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

type DepositRow = {
  id: string;
  internal_ref: string;
  amount_cents: number;
  currency: string;
  network: string;
  status: string;
  provider_ref: string | null;
  created_at: string;
};

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CREDITABLE = new Set(["pending", "awaiting_payment", "confirming"]);

export function AdminDeposits() {
  const [rows, setRows] = useState<DepositRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/admin/deposits");
    if (!res.ok) {
      toast.error("Could not load deposits");
      return;
    }
    const json: { deposits: DepositRow[] } = await res.json();
    setRows(json.deposits);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(depositId: string, action: "verify" | "reject") {
    setBusy(depositId);
    try {
      const res = await fetch("/api/v1/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId, action, reason: action === "reject" ? "Rejected by admin" : undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? `Could not ${action} deposit`);
        return;
      }
      toast.success(action === "verify" ? "Deposit credited" : "Deposit rejected");
      await load();
    } catch {
      toast.error(`Could not ${action} deposit`);
    } finally {
      setBusy(null);
    }
  }

  if (!rows) return <p className="text-sm text-slate-500">Loading deposit orders…</p>;

  return (
    <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Deposit orders <span className="font-normal text-slate-400">({rows.length})</span>
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="size-3.5" aria-hidden /> Refresh
        </Button>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No deposit orders yet"
          description="Deposit orders created by customers will appear here for verification."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-5 py-2.5 font-medium">Reference</th>
                <th className="px-5 py-2.5 font-medium">Amount</th>
                <th className="px-5 py-2.5 font-medium">Network</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => {
                const s = depositStatus(row.status);
                return (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{row.internal_ref}</td>
                    <td className="px-5 py-3 font-medium tabular-nums text-slate-900 dark:text-slate-100">
                      {usd(row.amount_cents)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{row.network}</td>
                    <td className="px-5 py-3">
                      <StatusPill tone={s.tone} label={s.label} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {CREDITABLE.has(row.status) ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy === row.id}
                              onClick={() => void act(row.id, "verify")}
                            >
                              {busy === row.id ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="size-3.5" aria-hidden />}
                              Verify
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busy === row.id}
                              onClick={() => void act(row.id, "reject")}
                            >
                              <XCircle className="size-3.5" aria-hidden /> Reject
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
  );
}