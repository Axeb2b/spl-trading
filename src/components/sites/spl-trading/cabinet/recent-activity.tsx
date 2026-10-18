import Link from "next/link";
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, Clock3 } from "lucide-react";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { formatDate, formatUsd } from "@/lib/format";

export type ActivityItem = {
  id: string;
  reference: string;
  kind: "deposit" | "payout";
  status: string;
  tone: StatusTone;
  amountCents: number;
  createdAt: string;
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Recent activity</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Latest deposit and payout records</p>
        </div>
        <Link href="/report" className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/60">
          All activity <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Clock3 className="size-[18px]" aria-hidden />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Nothing recorded yet</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">New deposit orders and payout requests will appear here with their current status.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const isDeposit = item.kind === "deposit";
            const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;
            return (
              <li key={`${item.kind}-${item.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:flex-nowrap sm:px-6">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isDeposit ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{isDeposit ? "Deposit order" : "Payout request"}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">{item.reference}</p>
                </div>
                <div className="order-3 flex w-full items-center justify-between gap-3 pl-[52px] sm:order-none sm:w-auto sm:justify-start sm:pl-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.createdAt)}</span>
                  <StatusPill tone={item.tone} label={item.status} />
                </div>
                <p className={`ml-auto whitespace-nowrap font-mono text-sm font-semibold tabular-nums ${isDeposit ? "text-emerald-800 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200"}`}>
                  <span className="mr-1 text-xs text-slate-400" aria-hidden>{isDeposit ? "+" : "−"}</span>
                  <span className="sr-only">{isDeposit ? "Credit" : "Debit"} </span>
                  {formatUsd(item.amountCents)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
