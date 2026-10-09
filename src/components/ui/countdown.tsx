"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function formatRemaining(msLeft: number): string {
  if (msLeft <= 0) return "Expired";
  const totalSeconds = Math.floor(msLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type CountdownProps = {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
};

export function Countdown({ expiresAt, onExpire, className }: CountdownProps) {
  const target = new Date(expiresAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = target - now;
  const expired = remaining <= 0;

  useEffect(() => {
    if (expired) onExpire?.();
  }, [expired, onExpire]);

  return (
    <span
      className={cn(
        "font-mono text-sm tabular-nums",
        expired ? "text-red-600" : remaining < 5 * 60_000 ? "text-amber-600" : "text-slate-700",
        className,
      )}
      aria-live="polite"
    >
      {formatRemaining(remaining)}
    </span>
  );
}