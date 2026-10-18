"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, ExternalLink, LoaderCircle, RotateCw } from "lucide-react";
import { formatDate, formatUsd } from "@/lib/format";

type DepositRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  internal_ref: string;
  amount_cents: number;
  currency: string;
  network: string;
  status: string;
  provider_ref: string | null;
  created_at: string;
  expires_at: string | null;
};

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

function ReviewDeposit({ row, onDone }: { row: DepositRow; onDone: () => void }) {
  const [txHash, setTxHash] = useState("");
  const [paymentTime, setPaymentTime] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "verify" | "reject") {
    if (action === "verify" && (!TX_HASH_RE.test(txHash.trim()) || !paymentTime || !Number.isFinite(Date.parse(paymentTime)) || !confirmed)) {
      setError("Enter the BSC transaction hash and on-chain timestamp, then confirm your independent checks.");
      return;
    }
    if (action === "reject" && reason.trim().length < 5) {
      setError("Add a short reason before rejecting this order.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          depositId: row.id,
          ...(action === "verify" ? { providerRef: txHash.trim(), paymentTimestamp: new Date(paymentTime).toISOString() } : { reason: reason.trim() }),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Deposit review failed.");
      onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Deposit review failed.");
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
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Opened {formatDate(row.created_at)}</p>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Order expiry: {formatDate(row.expires_at)} · USDT on {row.network}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-bold tabular-nums text-slate-950 dark:text-white">{formatUsd(row.amount_cents)} {row.currency}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800 dark:text-amber-200">{row.status.replaceAll("_", " ")}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">BSC transaction hash</span>
          <input value={txHash} onChange={(event) => setTxHash(event.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" placeholder="0x…" className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-[11px] text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">On-chain payment time</span>
          <input type="datetime-local" value={paymentTime} onChange={(event) => setPaymentTime(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </label>
      </div>
      <div className="mt-2 min-h-5">
        {TX_HASH_RE.test(txHash.trim()) ? (
          <a href={`https://bscscan.com/tx/${txHash.trim()}`} target="_blank" rel="noreferrer" className="inline-flex min-h-7 items-center gap-1.5 text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300">
            Check on BscScan <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : (
          <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">Verify token, destination, amount, timestamp, and confirmations on BSC.</p>
        )}
      </div>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-amber-700" />
        <span>I independently checked the BSC transaction: USDT token, receiving address, exact amount, confirmations, and on-chain send time (before the order expiry) all match.</span>
      </label>
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Rejection reason (required to reject)" className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        <button type="button" disabled={busy || !TX_HASH_RE.test(txHash.trim()) || !paymentTime || !Number.isFinite(Date.parse(paymentTime)) || !confirmed} onClick={() => void act("verify")} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200">
          {busy ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Check className="size-3.5" aria-hidden />} Verify & credit
        </button>
        <button type="button" disabled={busy || reason.trim().length < 5} onClick={() => void act("reject")} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/40">Reject order</button>
      </div>
      {error ? <p role="alert" className="mt-3 text-xs font-medium text-red-700 dark:text-red-300">{error}</p> : null}
    </article>
  );
}

export function AdminDepositQueue() {
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/admin/deposits", { cache: "no-store" });
      const data = (await response.json()) as { deposits?: DepositRow[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load deposit orders.");
      setRows((data.deposits ?? []).filter((row) => ["pending", "awaiting_payment", "confirming"].includes(row.status)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load deposit orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/deposits", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { deposits?: DepositRow[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not load deposit orders.");
        return data.deposits ?? [];
      })
      .then((deposits) => {
        if (!cancelled) setRows(deposits.filter((row) => ["pending", "awaiting_payment", "confirming"].includes(row.status)));
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load deposit orders.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Deposit verification queue</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-400">Manual verification only. Compare the exact USDT transfer against the receiving address, amount, and order before crediting.</p>
        </div>
        <button type="button" onClick={() => { setError(null); setLoading(true); void reload(); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><RotateCw className="size-3.5" aria-hidden /> Refresh</button>
      </div>

      {loading ? <div className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"><LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading pending orders…</div> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900"><Check className="mx-auto size-5 text-emerald-700 dark:text-emerald-300" aria-hidden /><p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">No pending deposits</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">New orders will appear here for manual verification.</p></div> : null}
      {!loading ? rows.map((row) => <ReviewDeposit key={row.id} row={row} onDone={() => void reload()} />) : null}
      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />Never credit from a customer screenshot or a submitted hash alone. Independently inspect the confirmed on-chain transaction first.</p>
    </section>
  );
}
