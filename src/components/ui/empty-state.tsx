import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-12 text-center", className)}>
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon className="size-6" aria-hidden />
        </div>
      ) : null}
      <div className="text-base font-medium text-slate-800">{title}</div>
      {description ? <div className="max-w-sm text-sm text-slate-500">{description}</div> : null}
      {action}
    </div>
  );
}