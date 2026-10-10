"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, RefreshCw, PlayCircle, ArrowUpFromLine } from "lucide-react";
import { StatusPill, withdrawalStatus } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

type WithdrawalRow = {
  id: string;
  internal_ref: string;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  currency: string;
  destination_type: string;
  destination_ref: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
};

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminWithdrawals() {
  const [rows, setRows] = useState<WithdrawalRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/admin/withdrawals");
    if (!res.ok) {
      toast.error("Could not load withdrawals");
      return;
    }
    const json: { withdrawals: WithdrawalRow[] } = await res.json();
    setRows(json.withdrawals);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(withdrawalId: string, action: string) {
    const txHash =
      action === "complete"
        ? window.prompt("Transaction hash for the completed payout:") ?? undefined
        : undefined;
    if (action === "complete" && !txHash) return;

    setBusy(withdrawalId);
    try {
      const res = await fetch("/api/v1/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action, txHash, reason: action === "reject" ? "Rejected by admin" : undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? `Could not ${action} withdrawal`);
        return;
      }
      toast.success(`Withdrawal ${action.replace("_", " ")}`);
      await load();
    } catch {
      toast.error(`Could not ${action} withdrawal`);
    } finally {
      setBusy(null);
    }
  }

  if (!rows) return <p className="text-sm text-slate-500">Loading withdrawal requests…</p>;

  return (
    <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Withdrawal requests <span className="font-normal text-slate-400">({rows.length})</span>
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="size-3.5" aria-hidden /> Refresh
        </Button>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={ArrowUpFromLine}
          title="No withdrawal requests yet"
          description="Payout requests raised by customers will appear here for review."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-5 py-2.5 font-medium">Reference</th>
                <th className="px-5 py-2.5 font-medium">Amount</th>
                <th className="px-5 py-2.5 font-medium">Net</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => {
                const s = withdrawalStatus(row.status);
                return (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{row.internal_ref}</td>
                    <td className="px-5 py-3 font-medium tabular-nums text-slate-900 dark:text-slate-100">
                      {usd(row.amount_cents)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600 dark:text-slate-400">{usd(row.net_cents)}</td>
                    <td className="px-5 py-3">
                      <StatusPill tone={s.tone} label={s.label} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {busy === row.id ? (
                          <Loader2 className="size-4 animate-spin text-slate-400" aria-hidden />
                        ) : (
                          <WithdrawalActions status={row.status} onAct={(action) => void act(row.id, action)} />
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

function WithdrawalActions({ status, onAct }: { status: string; onAct: (action: string) => void }) {
  if (status === "pending") {
    return (
      <>
        <Button type="button" size="sm" onClick={() => onAct("approve")}>
          <CheckCircle2 className="size-3.5" aria-hidden /> Approve
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onAct("reject")}>
          <XCircle className="size-3.5" aria-hidden /> Reject
        </Button>
      </>
    );
  }
  if (status === "approved") {
    return (
      <Button type="button" size="sm" onClick={() => onAct("start_processing")}>
        <PlayCircle className="size-3.5" aria-hidden /> Start processing
      </Button>
    );
  }
  if (status === "processing") {
    return (
      <Button type="button" size="sm" onClick={() => onAct("complete")}>
        <CheckCircle2 className="size-3.5" aria-hidden /> Complete
      </Button>
    );
  }
  return <span className="text-xs text-slate-400">Settled</span>;
}