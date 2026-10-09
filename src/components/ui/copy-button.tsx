"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
  variant?: "icon" | "button";
};

export function CopyButton({ value, label, className, variant = "icon" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2",
          "text-sm font-medium text-slate-700 transition hover:bg-slate-50",
          "focus-visible:ring-2 focus-visible:ring-blue-500/40 outline-none",
          className,
        )}
      >
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        {copied ? "Copied" : (label ?? "Copy")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : (label ?? "Copy to clipboard")}
      title={copied ? "Copied" : (label ?? "Copy")}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-slate-200",
        "bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700",
        "focus-visible:ring-2 focus-visible:ring-blue-500/40 outline-none",
        className,
      )}
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  );
}