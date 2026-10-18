"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpFromLine,
  BadgeCheck,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileCheck,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { StatusPill, withdrawalStatus } from "@/components/ui/status-pill";
import { PayoutRequestForm } from "./payout-request-form";
import { formatDate, formatUsd } from "@/lib/format";
import { RecordsTable, type RecordColumn, type RecordFilter } from "./view-primitives";

export type PayoutRow = {
  id: string;
  reference: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  status: string;
  txHash: string | null;
  createdAt: string;
};

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

function shortHash(value: string): string {
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

const COLUMNS: RecordColumn<PayoutRow>[] = [
  { key: "reference", header: "Request reference", render: (row) => <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{row.reference}</span> },
  { key: "amount", header: "Requested", align: "right", render: (row) => <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatUsd(row.amountCents)}</span> },
  { key: "fee", header: "Fee", align: "right", render: (row) => <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatUsd(row.feeCents)}</span> },
  { key: "net", header: "Net after fee", align: "right", render: (row) => <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatUsd(row.netCents)}</span> },
  { key: "status", header: "Status", render: (row) => { const status = withdrawalStatus(row.status); return <StatusPill tone={status.tone} label={status.label} />; } },
  { key: "created", header: "Requested on", render: (row) => <time dateTime={row.createdAt} className="text-xs text-slate-500 dark:text-slate-400">{formatDate(row.createdAt)}</time> },
  {
    key: "receipt",
    header: "BSC receipt",
    render: (row) => TX_HASH_RE.test(row.txHash ?? "") ? (
      <a href={`https://bscscan.com/tx/${row.txHash}`} target="_blank" rel="noreferrer" aria-label={`View settlement transaction ${row.txHash} on BscScan`} className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-800 underline decoration-emerald-700/30 underline-offset-4 hover:decoration-emerald-700 dark:text-emerald-300 dark:decoration-emerald-300/30">
        {shortHash(row.txHash!)}<ExternalLink className="size-3" aria-hidden />
      </a>
    ) : <span className="text-xs text-slate-400 dark:text-slate-500">Not recorded</span>,
  },
];

const FILTERS: RecordFilter<PayoutRow>[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { label: "All statuses", value: "all" },
      { label: "Pending review", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Processing", value: "processing" },
      { label: "Completed", value: "completed" },
      { label: "Rejected", value: "rejected" },
      { label: "Failed", value: "failed" },
    ],
    getValue: (row) => row.status,
  },
];

const WORKFLOW = [
  {
    title: "Request",
    detail: "Choose an amount and BEP-20 destination. The fee and net account amount are shown before submission.",
    icon: ArrowUpFromLine,
  },
  {
    title: "Operator review",
    detail: "An operator reviews the request. The held balance is released if the request is rejected before processing.",
    icon: ShieldCheck,
  },
  {
    title: "Manual settlement",
    detail: "After approval, an operator sends the net USDT amount from the authorized wallet.",
    icon: WalletCards,
  },
  {
    title: "Receipt recorded",
    detail: "The BSC transaction hash is attached to the completed request for your records.",
    icon: FileCheck,
  },
] as const;

type PayoutsViewProps = {
  rows: PayoutRow[];
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  creditedDepositCents: number;
  unlockThresholdCents: number;
  balanceCents: number;
  minCents: number;
  feeBps: number;
};

export function PayoutsView({
  rows,
  depositsEnabled,
  withdrawalsEnabled,
  creditedDepositCents,
  unlockThresholdCents,
  balanceCents,
  minCents,
  feeBps,
}: PayoutsViewProps) {
  const totalCents = rows.reduce((sum, row) => sum + row.amountCents, 0);
  const feeTotalCents = rows.reduce((sum, row) => sum + row.feeCents, 0);
  const summary = `${rows.length} ${rows.length === 1 ? "request" : "requests"} · ${formatUsd(totalCents)} requested · ${formatUsd(feeTotalCents)} fees`;
  const eligible = creditedDepositCents >= unlockThresholdCents;
  const progress = Math.min(100, Math.floor((creditedDepositCents / unlockThresholdCents) * 100));
  const access = !withdrawalsEnabled
    ? { label: "Currently unavailable", tone: "neutral" as const }
    : !eligible
      ? { label: "Verified deposit required", tone: "warning" as const }
      : balanceCents < minCents
        ? { label: "Below payout minimum", tone: "warning" as const }
        : { label: "Ready to request", tone: "success" as const };

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#0c1d18] p-5 text-white shadow-[0_20px_60px_rgba(4,18,14,0.14)] sm:p-7 lg:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-14 -top-28 size-72 rounded-full bg-lime-300/[0.11] blur-3xl" />
          <div className="absolute -bottom-36 left-1/3 size-64 rounded-full bg-emerald-400/[0.10] blur-3xl" />
          <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:34px_34px]" />
        </div>
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lime-100/75">Payout desk · Request to receipt</p>
            <StatusPill tone={access.tone} label={access.label} className="border border-white/10 bg-white/10 text-white ring-white/10 dark:bg-white/10 dark:text-white dark:ring-white/10" />
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.72fr)] lg:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Payouts, with a clear trail.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/70 sm:text-[15px]">
                Review the fee before you submit, follow each operator-reviewed status, and find the BSC receipt on completed requests.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime-200/10 text-lime-100"><LockKeyhole className="size-4" aria-hidden /></span>
                <div>
                  <p className="text-xs font-semibold text-white">BEP-20 USDT · manual settlement</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-50/65">There is no automatic payout provider or transfer call in this build. A qualified operator reviews and records each settlement.</p>
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-6 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-50/55">Available balance</dt>
              <dd className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-white">{formatUsd(balanceCents)}</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-50/55">Verified deposits</dt>
              <dd className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-white">{formatUsd(creditedDepositCents)} <span className="text-xs font-medium text-emerald-50/55">/ {formatUsd(unlockThresholdCents)} unlock</span></dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-50/55">Configured platform fee</dt>
              <dd className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-white">{(feeBps / 100).toFixed(2)}<span className="ml-0.5 text-sm text-emerald-50/65">%</span></dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="payout-flow-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-300">Payout lifecycle</p>
            <h2 id="payout-flow-title" className="mt-1 text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">A request you can follow</h2>
          </div>
          <p className="max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">The status changes when the operator records each step; this page does not send funds automatically.</p>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/55">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300"><Icon className="size-4" aria-hidden /></span>
                  <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-400">{step.detail}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {!withdrawalsEnabled ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/70 dark:bg-amber-950/30 sm:p-6">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-amber-800 dark:text-amber-200" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Payout requests are currently unavailable</h2>
              <p className="mt-1 text-xs leading-5 text-amber-950/80 dark:text-amber-100/80">The platform operator has not enabled this feature for the deployment. A verified-deposit threshold alone does not activate payout operations.</p>
            </div>
          </div>
        </section>
      ) : !eligible ? (
        <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] dark:border-amber-900/60 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-200"><LockKeyhole className="size-[18px]" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-amber-800 dark:text-amber-300">Access requirement</p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">Verify and credit at least {formatUsd(unlockThresholdCents)} to unlock payouts</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">Only operator-verified deposits count. A pending order does not unlock payout requests.</p>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{progress}% complete</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">{formatUsd(creditedDepositCents)} / {formatUsd(unlockThresholdCents)}</span>
                <span className="text-slate-500 dark:text-slate-400">{formatUsd(Math.max(0, unlockThresholdCents - creditedDepositCents))} remaining</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Verified deposit progress toward payout access" aria-valuemin={0} aria-valuemax={unlockThresholdCents} aria-valuenow={Math.min(creditedDepositCents, unlockThresholdCents)}>
                <div className="h-full rounded-full bg-amber-400 transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </div>
              {depositsEnabled ? (
                <Link href="/" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#ffda3d] px-4 text-xs font-bold text-[#17191f] transition hover:bg-[#ffe46a]">
                  Open deposit options<ArrowRight className="size-3.5" aria-hidden />
                </Link>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Deposit orders are also disabled in this deployment. Contact support for availability information.</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <PayoutRequestForm balanceCents={balanceCents} minCents={minCents} feeBps={feeBps} />
      )}

      {rows.length > 0 ? (
        <section aria-labelledby="payout-history-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-300">Request log</p>
              <h2 id="payout-history-title" className="mt-1 text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">Payout activity</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed requests include a link to their BSC transaction hash.</p>
          </div>
          <RecordsTable
            rows={rows}
            columns={COLUMNS}
            getKey={(row) => row.id}
            searchText={(row) => `${row.reference} ${row.status} ${row.txHash ?? ""}`}
            searchLabel="Search request reference or transaction hash…"
            emptyTitle="No payout requests yet"
            emptyDescription="Requests associated with your account will appear here with their fee, net amount, current status, and settlement receipt."
            summary={summary}
            filters={FILTERS}
            showDateFilters
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-7 dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto max-w-xl text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"><CircleAlert className="size-[18px]" aria-hidden /></span>
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No payout activity yet</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">When a request is submitted, its reference, fee, status changes, and BSC receipt will be kept together here.</p>
            {!withdrawalsEnabled ? <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300"><Clock3 className="size-3.5" aria-hidden />Payout requests are not enabled</p> : eligible ? <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300"><BadgeCheck className="size-3.5" aria-hidden />Eligible to request when the form is available</p> : null}
          </div>
        </section>
      )}

      <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
        Amounts are recorded in USD. This build does not quote a live USDT conversion rate or network fee; confirm the net USDT amount with the operator before settlement.
      </p>
    </div>
  );
}
