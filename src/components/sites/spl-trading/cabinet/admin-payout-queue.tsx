"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, ExternalLink, LoaderCircle, RotateCw } from "lucide-react";
import { formatDate, formatUsd } from "@/lib/format";

type PayoutRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  internal_ref: string;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  destination_type: string;
  destination_ref: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
};

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

function ReviewPayout({ row, onDone }: { row: PayoutRow; onDone: () => void }) {
  const [txHash, setTxHash] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "start_processing" | "complete" | "reject") {
    if (action === "complete" && (!TX_HASH_RE.test(txHash.trim()) || !confirmed)) {
      setError("Enter a BSC transaction hash and confirm the transfer is settled before completing.");
      return;
    }
    if (action === "reject" && reason.trim().length < 5) {
      setError("Add a short reason before rejecting this payout.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          withdrawalId: row.id,
          ...(action === "complete" ? { txHash: txHash.trim() } : {}),
          ...(action === "reject" ? { reason: reason.trim() } : {}),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Payout action failed.");
      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payout action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{row.internal_ref}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.user_name || row.user_email} · {row.user_email}</p>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Requested {formatDate(row.created_at)}</p>
          <p className="mt-2 break-all font-mono text-[11px] leading-5 text-slate-600 dark:text-slate-400">{row.destination_type}: {row.destination_ref}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-bold tabular-nums text-slate-950 dark:text-white">{formatUsd(row.amount_cents)}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800 dark:text-amber-200">{row.status.replaceAll("_", " ")}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-[11px] dark:bg-slate-800/70">
        <div><dt className="text-slate-500 dark:text-slate-400">Requested</dt><dd className="mt-1 font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">{formatUsd(row.amount_cents)}</dd></div>
        <div><dt className="text-slate-500 dark:text-slate-400">Fee</dt><dd className="mt-1 font-mono tabular-nums text-slate-800 dark:text-slate-200">{formatUsd(row.fee_cents)}</dd></div>
        <div><dt className="text-slate-500 dark:text-slate-400">Net</dt><dd className="mt-1 font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">{formatUsd(row.net_cents)}</dd></div>
      </dl>

      {row.status === "pending" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void act("approve")} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-800 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200">{busy ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />} Approve request</button>
          <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void act("reject")} className="inline-flex min-h-10 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40">Reject</button>
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason required to reject" className="min-h-10 min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
      ) : null}

      {row.status === "approved" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void act("start_processing")} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-800 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200">{busy ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <ArrowUpRight className="size-3.5" aria-hidden />} Mark processing</button>
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason required to reject" className="min-h-10 min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void act("reject")} className="inline-flex min-h-10 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40">Reject</button>
        </div>
      ) : null}

      {row.status === "processing" ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="block"><span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">BSC settlement transaction hash</span><input value={txHash} onChange={(event) => { setTxHash(event.target.value); setError(null); }} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder="0x…" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-[11px] text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" /></label>
            {TX_HASH_RE.test(txHash.trim()) ? <a href={`https://bscscan.com/tx/${txHash.trim()}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-end gap-1 text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300">Check on BscScan <ExternalLink className="size-3.5" aria-hidden /></a> : null}
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-amber-700" /><span>I have sent the net payout from the platform wallet and independently confirmed its BSC transaction.</span></label>
          <button type="button" disabled={busy || !TX_HASH_RE.test(txHash.trim()) || !confirmed} onClick={() => void act("complete")} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#ffda3d] px-3 text-xs font-bold text-[#17191f] transition hover:bg-[#ffe46a] disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />} Record completed payout</button>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-xs font-medium text-red-700 dark:text-red-300">{error}</p> : null}
    </article>
  );
}

export function AdminPayoutQueue() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/admin/withdrawals", { cache: "no-store" });
      const data = (await response.json()) as { withdrawals?: PayoutRow[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load payout requests.");
      setRows((data.withdrawals ?? []).filter((row) => ["pending", "approved", "processing"].includes(row.status)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load payout requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/withdrawals", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { withdrawals?: PayoutRow[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not load payout requests.");
        return data.withdrawals ?? [];
      })
      .then((withdrawals) => {
        if (!cancelled) setRows(withdrawals.filter((row) => ["pending", "approved", "processing"].includes(row.status)));
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load payout requests.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Payout operations queue</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-400">This console records manual operations; it does not send funds. Approve only after review, send via the authorized wallet, then record the confirmed transaction hash.</p>
        </div>
        <button type="button" onClick={() => { setError(null); setLoading(true); void reload(); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><RotateCw className="size-3.5" aria-hidden /> Refresh</button>
      </div>

      {loading ? <div className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"><LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading open requests…</div> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900"><Check className="mx-auto size-5 text-emerald-700 dark:text-emerald-300" aria-hidden /><p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">No open payout requests</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pending requests will appear here after customers pass the verified-deposit gate.</p></div> : null}
      {!loading ? rows.map((row) => <ReviewPayout key={row.id} row={row} onDone={() => void reload()} />) : null}
      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />Never reject a payout after it has been marked processing. If a transfer may have been sent, investigate and reconcile it before changing ledger state.</p>
    </section>
  );
}
