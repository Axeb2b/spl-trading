"use client";

import { useServerNow } from "@/hooks/use-server-now";
import { formatIst } from "@/lib/time/ist";
import { relativeIst } from "@/lib/time/relative";

export type TimestampMode = "absolute" | "relative" | "dual";

type TimestampProps = {
  iso: string | null | undefined;
  mode?: TimestampMode;
  className?: string;
};

/**
 * Renders a timestamp in IST.
 *
 * The server always renders the absolute form, so the first client render is
 * byte-identical to the SSR output. Relative labels appear only after mount,
 * when the client is anchored to the server clock.
 */
export function Timestamp({ iso, mode = "absolute", className }: TimestampProps) {
  const nowMs = useServerNow();

  if (!iso) return <span className={className}>—</span>;

  const absolute = formatIst(iso, "full");

  if (mode === "absolute" || nowMs === null) {
    return (
      <time dateTime={iso} title={`${absolute} (${iso})`} className={className}>
        {absolute}
      </time>
    );
  }

  const relative = relativeIst(iso, new Date(nowMs).toISOString());
  if (!relative) {
    return (
      <time dateTime={iso} title={`${absolute} (${iso})`} className={className}>
        {absolute}
      </time>
    );
  }

  return (
    <time dateTime={iso} title={`${absolute} (${iso})`} className={className}>
      {mode === "relative" ? relative : `${relative} · ${absolute}`}
    </time>
  );
}
