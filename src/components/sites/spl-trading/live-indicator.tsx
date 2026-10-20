"use client";

import type { RealtimeState } from "@/hooks/use-realtime";

const LABELS: Record<RealtimeState, string> = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  polling: "Polling",
  offline: "Offline",
};

const DOT_CLASS: Record<RealtimeState, string> = {
  connecting: "bg-slate-400",
  live: "bg-emerald-500 animate-pulse",
  reconnecting: "bg-slate-400",
  polling: "bg-amber-500",
  offline: "bg-red-500",
};

/**
 * Connectivity indicator.
 *
 * It reports what the transport is actually doing — an SSE heartbeat, not a
 * hardcoded "Online" pill.
 */
export function LiveIndicator({ state }: { state: RealtimeState }) {
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 sm:inline-flex dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800"
      aria-live="polite"
      title={LABELS[state]}
    >
      <span className={`size-1.5 rounded-full ${DOT_CLASS[state]}`} aria-hidden />
      {LABELS[state]}
    </span>
  );
}
