import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "negative" | "muted";
  className?: string;
};

const TONE_TEXT: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-slate-950 dark:text-slate-50",
  positive: "text-emerald-800 dark:text-emerald-300",
  negative: "text-red-700 dark:text-red-300",
  muted: "text-slate-500 dark:text-slate-300",
};

export function StatCard({ label, value, sublabel, icon: Icon, tone = "default", className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.02] sm:p-5 dark:border-slate-800 dark:bg-slate-900", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
          <span className="truncate">{label}</span>
        </div>
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className={cn("mt-3 font-mono text-[1.65rem] font-semibold tabular-nums tracking-[-0.04em]", TONE_TEXT[tone])}>{value}</div>
      {sublabel ? <div className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{sublabel}</div> : null}
    </div>
  );
}

type StatCardGridProps = {
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
};

const GRID_COLS: Record<NonNullable<StatCardGridProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export function StatCardGrid({ columns = 3, className, children }: StatCardGridProps) {
  return <div className={cn("grid gap-3 sm:gap-4", GRID_COLS[columns], className)}>{children}</div>;
}
