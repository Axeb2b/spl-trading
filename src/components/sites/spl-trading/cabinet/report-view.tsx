import { Toolbar, SelectField, DateField, DataTable } from "./view-primitives";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { formatUsd, formatDate, ledgerTypeLabel } from "@/lib/format";

export type LedgerRow = {
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

const COLUMNS = [
  { key: "reference", header: "Reference" },
  { key: "type", header: "Type" },
  { key: "description", header: "Description" },
  { key: "amount", header: "Amount", align: "right" as const },
  { key: "created", header: "Created", className: "text-slate-500" },
];

export function ReportView({ rows }: { rows: LedgerRow[] }) {
  const creditedCents = rows
    .filter((row) => row.amountCents > 0)
    .reduce((sum, row) => sum + row.amountCents, 0);
  const debitedCents = rows
    .filter((row) => row.amountCents < 0)
    .reduce((sum, row) => sum + Math.abs(row.amountCents), 0);

  const summary = `${rows.length} ledger entr${rows.length === 1 ? "y" : "ies"} · ${formatUsd(creditedCents)} in · ${formatUsd(debitedCents)} out`;

  return (
    <>
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Transaction Report
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{summary}</p>
      </header>
      <Toolbar
        placeholder="Search by reference…"
        filters={
          <>
            <SelectField
              label="Type"
              value="All types"
              options={["All types", "Deposit", "Withdrawal", "Fee", "Referral reward"]}
            />
            <DateField label="From" />
            <DateField label="To" />
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        emptyText="No ledger activity yet."
        rows={rows.map((row) => ({
          reference: <span className="font-mono text-xs">{row.reference}</span>,
          type: (
            <StatusPill
              tone={TYPE_TONE[row.type] ?? "neutral"}
              label={ledgerTypeLabel(row.type)}
            />
          ),
          description: (
            <span className="block max-w-[20rem] truncate text-slate-600 dark:text-slate-400">
              {row.description || "—"}
            </span>
          ),
          amount: (
            <span
              className={
                row.amountCents < 0
                  ? "tabular-nums font-medium text-red-600"
                  : "tabular-nums font-medium text-emerald-600"
              }
            >
              {formatUsd(row.amountCents)}
            </span>
          ),
          created: <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
        }))}
      />
    </>
  );
}
