"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { formatDate, formatUsd, ledgerTypeLabel } from "@/lib/format";
import { RecordsTable, type RecordColumn, type RecordFilter } from "./view-primitives";

export type LedgerRow = {
  id: string;
  reference: string;
  type: string;
  amountCents: number;
  description: string;
  createdAt: string;
};

const TYPE_TONE: Record<string, StatusTone> = {
  deposit: "success",
  withdrawal: "info",
  fee: "neutral",
  referral_reward: "warning",
  adjustment: "neutral",
};

const COLUMNS: RecordColumn<LedgerRow>[] = [
  { key: "reference", header: "Reference", render: (row) => <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{row.reference}</span> },
  { key: "type", header: "Type", render: (row) => <StatusPill tone={TYPE_TONE[row.type] ?? "neutral"} label={ledgerTypeLabel(row.type)} /> },
  { key: "description", header: "Description", render: (row) => <span className="block max-w-[20rem] truncate text-xs text-slate-600 dark:text-slate-400">{row.description || "—"}</span> },
  { key: "amount", header: "Amount", align: "right", render: (row) => <span className={`inline-flex items-center justify-end gap-1 font-mono text-xs font-semibold tabular-nums ${row.amountCents < 0 ? "text-red-700 dark:text-red-300" : "text-emerald-800 dark:text-emerald-300"}`}>{row.amountCents < 0 ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownLeft className="size-3.5" aria-hidden />}{formatUsd(row.amountCents)}</span> },
  { key: "created", header: "Created", render: (row) => <time dateTime={row.createdAt} className="text-xs text-slate-500 dark:text-slate-400">{formatDate(row.createdAt)}</time> },
];

const FILTERS: RecordFilter<LedgerRow>[] = [
  {
    id: "type",
    label: "Type",
    options: [
      { label: "All types", value: "all" },
      { label: "Deposit", value: "deposit" },
      { label: "Withdrawal", value: "withdrawal" },
      { label: "Fee", value: "fee" },
      { label: "Referral reward", value: "referral_reward" },
      { label: "Adjustment", value: "adjustment" },
    ],
    getValue: (row) => row.type,
  },
];

export function ReportView({ rows }: { rows: LedgerRow[] }) {
  const creditedCents = rows
    .filter((row) => row.amountCents > 0)
    .reduce((sum, row) => sum + row.amountCents, 0);
  const debitedCents = rows
    .filter((row) => row.amountCents < 0)
    .reduce((sum, row) => sum + Math.abs(row.amountCents), 0);
  const summary = `${rows.length} ${rows.length === 1 ? "ledger entry" : "ledger entries"} · ${formatUsd(creditedCents)} in · ${formatUsd(debitedCents)} out`;

  return (
    <RecordsTable
      rows={rows}
      columns={COLUMNS}
      getKey={(row) => row.id}
      searchText={(row) => `${row.reference} ${row.type} ${row.description}`}
      searchLabel="Search reference, type, or description…"
      emptyTitle="No ledger activity yet"
      emptyDescription="Verified deposits, payout holds, and fees are recorded here as ledger entries."
      emptyAction={<Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-900 px-4 text-xs font-semibold text-white transition hover:bg-emerald-800 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200">Return to overview</Link>}
      summary={summary}
      filters={FILTERS}
      showDateFilters
    />
  );
}
