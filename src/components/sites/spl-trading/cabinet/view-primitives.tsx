import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Column = {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
};

/**
 * Responsive data table.
 *
 * Below `md` each row collapses into a stacked label/value list, because the
 * cabinet is used on phones and horizontal scrolling hides the status column —
 * the single most important field.
 */
export function DataTable({
  columns,
  rows,
  emptyText,
}: {
  columns: Column[];
  rows: Record<string, ReactNode>[];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <p className="px-5 py-14 text-center text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800/60">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={column.className ?? (column.align === "right" ? "text-right" : undefined)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={column.className ?? (column.align === "right" ? "text-right" : undefined)}
                >
                  {row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Stacked label/value list, used as the mobile rendering of a table row. */
export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 py-2">
          <dt className="text-xs uppercase tracking-wide text-slate-400">{item.label}</dt>
          <dd className="text-right text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Search + filter bar shown above the list views. */
export function Toolbar({
  placeholder,
  filters,
  summary,
}: {
  placeholder: string;
  filters?: ReactNode;
  summary?: string;
}) {
  return (
    <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <i
            className="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-slate-500"
          />
        </div>
      </div>
      {filters ? <div className="mt-4 flex flex-wrap items-end gap-4">{filters}</div> : null}
      {summary ? <p className="mt-4 text-sm text-slate-500">{summary}</p> : null}
    </section>
  );
}

export function SelectField({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options?: string[];
}) {
  const choices = options ?? [value];
  return (
    <label className="flex min-w-36 flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
      {label}
      <select
        defaultValue={value}
        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DateField({ label }: { label: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-400">
      {label}
      <input
        type="date"
        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      />
    </label>
  );
}
