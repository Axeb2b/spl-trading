"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowRight, CircleAlert, LockKeyhole, ShieldCheck } from "lucide-react";
import { DepositDialog } from "./deposit-dialog";

type DepositUnlockViewProps = {
  creditedCents: number;
  thresholdCents: number;
  depositsEnabled: boolean;
};

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function DepositUnlockView({ creditedCents, thresholdCents, depositsEnabled }: DepositUnlockViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const progress = Math.min(100, Math.round((creditedCents / thresholdCents) * 100));
  const remainingCents = Math.max(0, thresholdCents - creditedCents);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
        <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-[#30343c] bg-[#191c22] p-5 text-white shadow-sm shadow-slate-950/10 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-28 -z-10 size-80 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
              <LockKeyhole className="size-3.5 text-amber-300" aria-hidden /> Member access
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
              <ShieldCheck className="size-4 text-emerald-300" aria-hidden /> Verified funds only
            </span>
          </div>

          <div className="mt-8 max-w-2xl">
            <p className="text-sm font-medium text-amber-200">Your account is ready for its first deposit</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
              Verify at least $500 to unlock payout features.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              Create an order, send USDT on BNB Smart Chain, then wait for an operator to verify the on-chain transfer. Pending orders do not unlock access.
            </p>
          </div>

          <div className="mt-8 max-w-xl rounded-2xl border border-white/10 bg-black/15 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-300">Verified deposits</p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-white">
                  {formatUsd(creditedCents)} <span className="text-base font-medium text-slate-400">/ {formatUsd(thresholdCents)}</span>
                </p>
              </div>
              <span className="rounded-lg bg-white/[0.06] px-2.5 py-1.5 font-mono text-xs font-semibold tabular-nums text-amber-200">{progress}%</span>
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Verified deposit progress toward payout access"
              aria-valuemin={0}
              aria-valuemax={thresholdCents}
              aria-valuenow={Math.min(creditedCents, thresholdCents)}
            >
              <div className="h-full rounded-full bg-amber-300 transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {remainingCents > 0
                ? `${formatUsd(remainingCents)} more in verified deposits to unlock payout requests.`
                : "Minimum verified deposit reached. Payout access is unlocked for this account."}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffda3d] px-5 text-sm font-bold text-[#17191f] shadow-sm transition hover:bg-[#ffe46a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffda3d]"
            >
              <ArrowDownToLine className="size-4" aria-hidden />
              {depositsEnabled ? "Create a $500 deposit order" : "Check deposit availability"}
            </button>
            <Link href="/payins" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
              View deposit history <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {!depositsEnabled ? (
            <p className="mt-3 max-w-lg text-xs leading-5 text-amber-100/80" role="status">
              Deposit orders are currently disabled for this deployment. No funds can be sent from this preview.
            </p>
          ) : null}
        </section>

        <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-[#151b18] sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Before you send</p>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-slate-950 dark:text-white">Three checks. One clear record.</h3>
          <ol className="mt-5 space-y-4">
            {[
              ["Create an order", "The $500 minimum, exact amount, reference, and expiry are shown first."],
              ["Match the network", "Send USDT only on BNB Smart Chain (BEP-20) to the order address."],
              ["Wait for verification", "Your balance changes only after an operator independently verifies the transfer."],
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-5 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>Blockchain transfers are generally irreversible. Check the token, network, address, and amount in your wallet before confirming.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Link href="/fees" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Fees & limits</Link>
            <Link href="/risk" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Risk disclosure</Link>
          </div>
        </aside>
      </div>

      {dialogOpen ? <DepositDialog depositsEnabled={depositsEnabled} onClose={() => setDialogOpen(false)} /> : null}
    </>
  );
}
