"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BookOpenCheck,
  Info,
  LockKeyhole,
  Wallet,
} from "lucide-react";
import { DepositDialog } from "./deposit-dialog";
import { formatUsd } from "@/lib/format";

type DashboardSummary = {
  availableCashCents: number;
  depositedPrincipalCents: number;
  pendingWithdrawalCents: number;
  hasCreditedDeposit: boolean;
  transactionCount: number;
};

type DashboardCardsProps = {
  summary: DashboardSummary;
  depositsEnabled: boolean;
};

export function DashboardCards({ summary, depositsEnabled }: DashboardCardsProps) {
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <>
      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(270px,0.75fr)]">
        <section className="relative isolate overflow-hidden rounded-[1.6rem] bg-[#0b3027] p-5 text-white shadow-[0_18px_45px_rgba(10,50,38,0.12)] sm:p-7">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-lime-200/10 blur-[70px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-36 left-1/3 -z-10 size-80 rounded-full bg-teal-400/10 blur-[80px]" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-50/75">
                <Wallet className="size-4" aria-hidden />
                Available balance
              </p>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/70">
                <span aria-hidden className="size-1.5 rounded-full bg-lime-200" />
                USD ledger
              </span>
            </div>

            <p className="mt-4 font-mono text-4xl font-semibold tabular-nums tracking-[-0.05em] sm:text-5xl">
              {formatUsd(summary.availableCashCents)}
            </p>
            <p className="mt-2 text-xs leading-5 text-emerald-50/55">
              Balance reflects verified ledger activity, not an investment valuation.
            </p>

            <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:max-w-lg">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/50">Credited deposits</dt>
                <dd className="mt-1.5 font-mono text-base font-semibold tabular-nums text-white sm:text-lg">{formatUsd(summary.depositedPrincipalCents)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/50">Payouts on hold</dt>
                <dd className="mt-1.5 font-mono text-base font-semibold tabular-nums text-white sm:text-lg">{formatUsd(summary.pendingWithdrawalCents)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setDepositOpen(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-semibold text-emerald-950 transition hover:-translate-y-0.5 hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-100/70"
              >
                <ArrowDownToLine className="size-4" aria-hidden />
                {depositsEnabled ? "Create a deposit order" : "Check deposit availability"}
              </button>
              <Link href="/payins" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white">
                View deposit history <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">Quick access</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Go straight to your records</p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <BookOpenCheck className="size-[18px]" aria-hidden />
              </span>
            </div>
            <div className="mt-5 grid gap-2">
              <Link href="/payouts" className="group flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 transition hover:border-emerald-300 hover:bg-emerald-50/55 dark:border-slate-800 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20">
                <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><ArrowUpFromLine className="size-4" aria-hidden /></span>
                <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">Payout activity</span>
                <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-300" aria-hidden />
              </Link>
              <Link href="/report" className="group flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3.5 transition hover:border-emerald-300 hover:bg-emerald-50/55 dark:border-slate-800 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20">
                <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><BookOpenCheck className="size-4" aria-hidden /></span>
                <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">Transaction report</span>
                <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-300" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
            {!summary.hasCreditedDeposit ? <LockKeyhole className="mt-0.5 size-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />}
            <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
              {!summary.hasCreditedDeposit
                ? "No deposits have been credited yet. A deposit is added to your balance only after verification."
                : `${summary.transactionCount} deposit and payout records are available in your account.`}
              {" "}
              <Link href="/fees" className="font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300">Fees & limits</Link>
            </p>
          </div>
        </section>
      </div>

      {depositOpen ? <DepositDialog depositsEnabled={depositsEnabled} onClose={() => setDepositOpen(false)} /> : null}
    </>
  );
}
