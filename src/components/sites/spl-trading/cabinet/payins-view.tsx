"use client";

import Link from "next/link";
import { StatusPill, depositStatus } from "@/components/ui/status-pill";
import { formatDate, formatUsd } from "@/lib/format";
import { RecordsTable, type RecordColumn, type RecordFilter } from "./view-primitives";

export type PayinRow = {
  id: string;
  reference: string;
  amountCents: number;
  network: string;
  status: string;
  createdAt: string;
};

const COLUMNS: RecordColumn<PayinRow>[] = [
  { key: "reference", header: "Reference", render: (row) => <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">{row.reference}</span> },
  { key: "amount", header: "Amount", align: "right", render: (row) => <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatUsd(row.amountCents)}</span> },
  { key: "network", header: "Network", render: (row) => <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{row.network}</span> },
  { key: "status", header: "Status", render: (row) => { const status = depositStatus(row.status); return <StatusPill tone={status.tone} label={status.label} />; } },
  { key: "created", header: "Created", render: (row) => <time dateTime={row.createdAt} className="text-xs text-slate-500 dark:text-slate-400">{formatDate(row.createdAt)}</time> },
];

const FILTERS: RecordFilter<PayinRow>[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { label: "All statuses", value: "all" },
      { label: "Pending review", value: "pending" },
      { label: "Awaiting payment", value: "awaiting_payment" },
      { label: "Confirming", value: "confirming" },
      { label: "Verified", value: "credited" },
      { label: "Expired", value: "expired" },
      { label: "Rejected", value: "rejected" },
    ],
    getValue: (row) => row.status,
  },
];

export function PayinsView({ rows }: { rows: PayinRow[] }) {
  const totalCents = rows.reduce((sum, row) => sum + row.amountCents, 0);
  const summary = `${rows.length} ${rows.length === 1 ? "deposit order" : "deposit orders"} · ${formatUsd(totalCents)} total`;

  return (
    <RecordsTable
      rows={rows}
      columns={COLUMNS}
      getKey={(row) => row.id}
      searchText={(row) => `${row.reference} ${row.network} ${row.status}`}
      searchLabel="Search deposits or reference…"
      emptyTitle="No deposit orders yet"
      emptyDescription="Deposit orders created from your overview will appear here with their status and network."
      emptyAction={<Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-900 px-4 text-xs font-semibold text-white transition hover:bg-emerald-800 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200">Go to overview</Link>}
      summary={summary}
      filters={FILTERS}
      showDateFilters
    />
  );
}
