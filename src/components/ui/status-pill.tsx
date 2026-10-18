import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  info: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-900",
  warning: "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900",
  success: "bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/55 dark:text-emerald-200 dark:ring-emerald-900",
  danger: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900",
};

type StatusPillProps = {
  tone?: StatusTone;
  label: string;
  className?: string;
};

export function StatusPill({ tone = "neutral", label, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Maps a deposit order status to a display tone + label. */
export function depositStatus(status: string): { tone: StatusTone; label: string } {
  switch (status) {
    case "credited":
      return { tone: "success", label: "Verified" };
    case "confirming":
      return { tone: "info", label: "Confirming" };
    case "awaiting_payment":
      return { tone: "info", label: "Awaiting payment" };
    case "pending":
      return { tone: "warning", label: "Pending review" };
    case "expired":
      return { tone: "neutral", label: "Expired" };
    case "rejected":
      return { tone: "danger", label: "Rejected" };
    default:
      return { tone: "neutral", label: status };
  }
}

/** Maps a withdrawal status to a display tone + label. */
export function withdrawalStatus(status: string): { tone: StatusTone; label: string } {
  switch (status) {
    case "completed":
      return { tone: "success", label: "Completed" };
    case "processing":
      return { tone: "info", label: "Processing" };
    case "approved":
      return { tone: "info", label: "Approved" };
    case "pending":
      return { tone: "warning", label: "Pending review" };
    case "rejected":
      return { tone: "danger", label: "Rejected" };
    case "failed":
      return { tone: "danger", label: "Failed" };
    default:
      return { tone: "neutral", label: status };
  }
}
