import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-lime-300 text-emerald-950 shadow-sm shadow-emerald-950/10",
        className,
      )}
    >
      <ArrowLeftRight className="size-[18px]" strokeWidth={2.4} />
    </span>
  );
}

type BrandLockupProps = {
  href?: string;
  inverse?: boolean;
  compact?: boolean;
  className?: string;
};

export function BrandLockup({
  href = "/",
  inverse = false,
  compact = false,
  className,
}: BrandLockupProps) {
  return (
    <Link href={href} className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <BrandMark className={compact ? "size-8 rounded-[10px]" : undefined} />
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate text-[15px] font-semibold leading-tight tracking-[-0.02em]",
            inverse ? "text-white" : "text-slate-950 dark:text-slate-50",
          )}
        >
          SPL Trading
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-0.5 block truncate text-[11px] leading-tight",
              inverse ? "text-white/55" : "text-slate-500 dark:text-slate-400",
            )}
          >
            Money movement, clearly tracked
          </span>
        ) : null}
      </span>
    </Link>
  );
}
