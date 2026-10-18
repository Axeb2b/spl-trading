"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type FilterOption = {
  label: string;
  value: string;
};

export type RecordColumn<Row> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: Row) => ReactNode;
};

export type RecordFilter<Row> = {
  id: string;
  label: string;
  options: FilterOption[];
  getValue: (row: Row) => string;
};

type RecordsTableProps<Row extends { createdAt: string }> = {
  rows: Row[];
  columns: RecordColumn<Row>[];
  getKey: (row: Row) => string;
  searchText: (row: Row) => string;
  searchLabel: string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  summary?: string;
  filters?: RecordFilter<Row>[];
  showDateFilters?: boolean;
};

export function RecordsTable<Row extends { createdAt: string }>({
  rows,
  columns,
  getKey,
  searchText,
  searchLabel,
  emptyTitle,
  emptyDescription,
  emptyAction,
  summary,
  filters = [],
  showDateFilters = false,
}: RecordsTableProps<Row>) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredRows = rows.filter((row) => {
    if (normalizedQuery && !searchText(row).toLocaleLowerCase().includes(normalizedQuery)) return false;
    for (const filter of filters) {
      const selected = filterValues[filter.id] ?? "all";
      if (selected !== "all" && filter.getValue(row) !== selected) return false;
    }
    const day = row.createdAt.slice(0, 10);
    if (fromDate && day < fromDate) return false;
    if (toDate && day > toDate) return false;
    return true;
  });

  const hasActiveFilters = Boolean(
    normalizedQuery || fromDate || toDate || Object.values(filterValues).some((value) => value !== "all"),
  );

  function resetFilters() {
    setQuery("");
    setFilterValues({});
    setFromDate("");
    setToDate("");
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
        <EmptyState icon={Search} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <span className="sr-only">{searchLabel}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchLabel}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:bg-slate-900 dark:focus:ring-emerald-400/10"
            />
          </label>
          {summary ? <p className="text-xs text-slate-500 dark:text-slate-400 lg:ml-auto">{summary}</p> : null}
        </div>

        {filters.length || showDateFilters ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            {filters.length ? (
              <div className="flex items-center gap-1.5 pb-2 text-slate-400" aria-hidden>
                <SlidersHorizontal className="size-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">Filter</span>
              </div>
            ) : null}
            {filters.map((filter) => (
              <label key={filter.id} className="flex min-w-[150px] flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">
                {filter.label}
                <select
                  value={filterValues[filter.id] ?? "all"}
                  onChange={(event) => setFilterValues((current) => ({ ...current, [filter.id]: event.target.value }))}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-700 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-emerald-400"
                >
                  {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            ))}
            {showDateFilters ? (
              <>
                <label className="flex min-w-[150px] flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">
                  From
                  <span className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
                    <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium normal-case tracking-normal text-slate-700 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-emerald-400" />
                  </span>
                </label>
                <label className="flex min-w-[150px] flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">
                  To
                  <span className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
                    <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium normal-case tracking-normal text-slate-700 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-emerald-400" />
                  </span>
                </label>
              </>
            ) : null}
            {hasActiveFilters ? (
              <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/50">
                <X className="size-3.5" aria-hidden /> Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">Showing {filteredRows.length} of {rows.length} records</p>

      {filteredRows.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">No matching records</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try changing your search or filters.</p>
          <button type="button" onClick={resetFilters} className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/50">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                  {columns.map((column) => (
                    <th key={column.key} scope="col" className={`px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 ${column.align === "right" ? "text-right" : "text-left"}`}>
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.map((row) => (
                  <tr key={getKey(row)} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    {columns.map((column) => (
                      <td key={column.key} className={`px-5 py-4 align-middle ${column.align === "right" ? "text-right" : "text-left"}`}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
            {filteredRows.map((row) => (
              <article key={getKey(row)} className="px-4 py-4 sm:px-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {columns.map((column, index) => (
                    <div key={column.key} className={index === 0 ? "col-span-2 border-b border-slate-100 pb-3 dark:border-slate-800" : "min-w-0"}>
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{column.header}</dt>
                      <dd className={`${column.align === "right" ? "text-right" : "text-left"} min-w-0 text-sm text-slate-800 dark:text-slate-200`}>
                        {column.render(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:px-5">
        <span>Showing {filteredRows.length} of {rows.length} {rows.length === 1 ? "record" : "records"}</span>
        {summary ? <span>{summary}</span> : null}
      </div>
    </div>
  );
}
