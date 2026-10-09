import {
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  CheckCircle2,
  Clock,
  CircleCheckBig,
  Percent,
} from "lucide-react";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { formatUsd } from "@/lib/format";

export type HomeCounts = {
  totalPayins: number;
  totalPayouts: number;
  totalTransactions: number;
  activePayins: number;
  successfulPayins: number;
  pendingPayouts: number;
  completedPayouts: number;
  creditedCents: number;
};

export function HomeStats({ counts }: { counts: HomeCounts }) {
  const successRate =
    counts.totalPayins === 0 ? null : Math.round((counts.successfulPayins / counts.totalPayins) * 100);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Overall statistics
        </h2>
        <StatCardGrid columns={3}>
          <StatCard
            label="Total payins"
            value={String(counts.totalPayins)}
            icon={ArrowDownLeft}
            sublabel={`${counts.activePayins} awaiting settlement`}
          />
          <StatCard
            label="Total payouts"
            value={String(counts.totalPayouts)}
            icon={ArrowUpRight}
            sublabel={`${counts.pendingPayouts} in flight`}
          />
          <StatCard
            label="Transactions"
            value={String(counts.totalTransactions)}
            icon={Layers}
            sublabel="All recorded activity"
          />
        </StatCardGrid>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Activity summary
        </h2>
        <StatCardGrid columns={4}>
          <StatCard label="Active payins" value={String(counts.activePayins)} icon={Clock} tone="muted" />
          <StatCard
            label="Successful payins"
            value={String(counts.successfulPayins)}
            icon={CheckCircle2}
            tone="positive"
          />
          <StatCard label="Pending payouts" value={String(counts.pendingPayouts)} icon={Clock} tone="muted" />
          <StatCard
            label="Completed payouts"
            value={String(counts.completedPayouts)}
            icon={CircleCheckBig}
            tone="positive"
          />
        </StatCardGrid>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <Percent className="size-4 text-slate-400" aria-hidden />
            Payin success rate
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            All time
          </span>
        </div>

        {counts.totalPayins === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No payins recorded yet — the success rate appears once you make a deposit.
          </p>
        ) : (
          <>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                {successRate}%
              </span>
              <span className="mb-1 text-sm text-slate-500">
                {counts.successfulPayins} of {counts.totalPayins} credited
              </span>
            </div>

            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              role="img"
              aria-label={`Payin success rate ${successRate} percent`}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${successRate ?? 0}%` }}
              />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
              <div>
                <dt className="text-slate-500">Credited principal</dt>
                <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-50">
                  {formatUsd(counts.creditedCents)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Failed or expired</dt>
                <dd className="font-medium tabular-nums text-slate-900 dark:text-slate-50">
                  {counts.totalPayins - counts.successfulPayins}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </section>
  );
}
