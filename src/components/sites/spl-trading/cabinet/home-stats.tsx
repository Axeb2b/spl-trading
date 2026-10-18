import {
  ArrowDownLeft,
  ArrowUpRight,
  Layers3,
  CheckCircle2,
  Clock3,
  CircleCheckBig,
  CircleX,
} from "lucide-react";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { formatUsd } from "@/lib/format";

export type HomeCounts = {
  totalPayins: number;
  totalPayouts: number;
  totalTransactions: number;
  activePayins: number;
  successfulPayins: number;
  failedPayins: number;
  resolvedPayins: number;
  pendingPayouts: number;
  completedPayouts: number;
  creditedCents: number;
};

export function HomeStats({ counts }: { counts: HomeCounts }) {
  const successRate = counts.resolvedPayins === 0
    ? null
    : Math.round((counts.successfulPayins / counts.resolvedPayins) * 100);

  return (
    <section className="space-y-7">
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">At a glance</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.025em] text-slate-950 dark:text-white">Account activity</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">All time · recorded orders</p>
        </div>
        <StatCardGrid columns={3}>
          <StatCard
            label="Deposit orders"
            value={String(counts.totalPayins)}
            icon={ArrowDownLeft}
            sublabel={`${counts.activePayins} awaiting resolution`}
          />
          <StatCard
            label="Payout requests"
            value={String(counts.totalPayouts)}
            icon={ArrowUpRight}
            sublabel={`${counts.pendingPayouts} in review or processing`}
          />
          <StatCard
            label="Total records"
            value={String(counts.totalTransactions)}
            icon={Layers3}
            sublabel="Deposit orders and payout requests"
          />
        </StatCardGrid>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Status summary</h2>
        <StatCardGrid columns={4}>
          <StatCard label="Open deposits" value={String(counts.activePayins)} icon={Clock3} tone="muted" />
          <StatCard label="Credited deposits" value={String(counts.successfulPayins)} icon={CheckCircle2} tone="positive" />
          <StatCard label="Pending payouts" value={String(counts.pendingPayouts)} icon={Clock3} tone="muted" />
          <StatCard label="Completed payouts" value={String(counts.completedPayouts)} icon={CircleCheckBig} tone="positive" />
        </StatCardGrid>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">Deposit outcomes</p>
            <h2 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">Verified vs. resolved orders</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Open orders are excluded until their status is final.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CircleX className="size-3.5 text-slate-400" aria-hidden />
            {counts.failedPayins} rejected or expired
          </div>
        </div>

        {successRate === null ? (
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
            No deposit outcomes are complete yet. The ratio appears after an order is credited, rejected, or expires.
          </p>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-3xl font-semibold tabular-nums tracking-[-0.04em] text-slate-950 dark:text-white">{successRate}%</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{counts.successfulPayins} of {counts.resolvedPayins} resolved orders credited</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" aria-label={`Among resolved deposit orders, ${successRate} percent were credited`}>
              <div className="h-full rounded-full bg-emerald-700 transition-all dark:bg-lime-300" style={{ width: `${successRate}%` }} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">Credited principal</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatUsd(counts.creditedCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">Rejected or expired</dt>
                <dd className="mt-1 font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">{counts.failedPayins}</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </section>
  );
}
