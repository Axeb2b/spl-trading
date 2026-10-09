import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
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