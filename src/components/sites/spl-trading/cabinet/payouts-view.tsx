import { Toolbar, SelectField, DataTable } from "./view-primitives";
import { StatusPill, withdrawalStatus } from "@/components/ui/status-pill";
import { formatUsd, formatDate } from "@/lib/format";

export type PayoutRow = {
  reference: string;
  amountCents: number;
  feeCents: number;
  status: string;
  createdAt: string;
};

const COLUMNS = [
  { key: "reference", header: "Reference" },
  { key: "amount", header: "Amount", align: "right" as const },
  { key: "fee", header: "Fee", align: "right" as const },
  { key: "status", header: "Status" },
  { key: "created", header: "Created", className: "text-slate-500" },
];

export function PayoutsView({ rows }: { rows: PayoutRow[] }) {
  const totalCents = rows.reduce((sum, row) => sum + row.amountCents, 0);
  const feeCents = rows.reduce((sum, row) => sum + row.feeCents, 0);
  const summary = `${rows.length} withdrawal${rows.length === 1 ? "" : "s"} · ${formatUsd(totalCents)} gross · ${formatUsd(feeCents)} fees`;

  return (
    <>
      <Toolbar
        placeholder="Search by reference…"
        summary={summary}
        filters={
          <>
            <SelectField
              label="Status"
              value="All statuses"
              options={["All statuses", "Pending", "Approved", "Processing", "Completed", "Rejected"]}
            />
            <SelectField
              label="Sort"
              value="Most recent first"
              options={["Most recent first", "Oldest first"]}
            />
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        emptyText="No withdrawals yet."
        rows={rows.map((row) => {
          const status = withdrawalStatus(row.status);
          return {
            reference: <span className="font-mono text-xs">{row.reference}</span>,
            amount: <span className="tabular-nums font-medium">{formatUsd(row.amountCents)}</span>,
            fee: <span className="tabular-nums text-slate-500">{formatUsd(row.feeCents)}</span>,
            status: <StatusPill tone={status.tone} label={status.label} />,
            created: <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
          };
        })}
      />
    </>
  );
}
