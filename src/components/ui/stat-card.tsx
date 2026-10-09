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
  default: "text-slate-900",
  positive: "text-emerald-600",
  negative: "text-red-600",
  muted: "text-slate-400",
};

export function StatCard({ label, value, sublabel, icon: Icon, tone = "default", className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {Icon ? <Icon className="size-4" aria-hidden /> : null}
        <span>{label}</span>
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", TONE_TEXT[tone])}>{value}</div>
      {sublabel ? <div className="mt-1 text-xs text-slate-400">{sublabel}</div> : null}
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
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function StatCardGrid({ columns = 3, className, children }: StatCardGridProps) {
  return <div className={cn("grid gap-4", GRID_COLS[columns], className)}>{children}</div>;
}