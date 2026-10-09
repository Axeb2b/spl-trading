import { Toolbar, SelectField, DateField, DataTable } from "./view-primitives";
import { StatusPill, depositStatus } from "@/components/ui/status-pill";
import { formatUsd, formatDate } from "@/lib/format";

export type PayinRow = {
  reference: string;
  amountCents: number;
  network: string;
  status: string;
  createdAt: string;
};

const COLUMNS = [
  { key: "reference", header: "Reference" },
  { key: "amount", header: "Amount", align: "right" as const },
  { key: "network", header: "Network" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created", className: "text-slate-500" },
];

export function PayinsView({ rows }: { rows: PayinRow[] }) {
  const totalCents = rows.reduce((sum, row) => sum + row.amountCents, 0);
  const summary = `${rows.length} payin${rows.length === 1 ? "" : "s"} · ${formatUsd(totalCents)} total`;

  return (
    <>
      <Toolbar
        placeholder="Search by reference…"
        summary={summary}
        filters={
          <>
            <SelectField label="Status" value="All statuses" options={["All statuses", "Pending", "Credited", "Rejected"]} />
            <DateField label="Created from" />
            <DateField label="Created to" />
          </>
        }
      />
      <DataTable
        columns={COLUMNS}
        emptyText="No deposits yet — create one from the home dashboard."
        rows={rows.map((row) => {
          const status = depositStatus(row.status);
          return {
            reference: <span className="font-mono text-xs">{row.reference}</span>,
            amount: <span className="tabular-nums font-medium">{formatUsd(row.amountCents)}</span>,
            network: <span className="text-xs uppercase text-slate-500">{row.network}</span>,
            status: <StatusPill tone={status.tone} label={status.label} />,
            created: <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
          };
        })}
      />
    </>
  );
}
