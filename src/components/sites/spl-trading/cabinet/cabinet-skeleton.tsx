import { Skeleton } from "@/components/ui/skeleton";

/** Shared skeleton frame for cabinet pages while data loads. */
export function CabinetSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={`row-${index}`} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}