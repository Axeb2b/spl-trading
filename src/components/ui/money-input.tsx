import { cn } from "@/lib/utils";

type MoneyInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  minCents?: number;
  maxCents?: number;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

function formatAmount(cents: number, currency: string): string {
  return `${currency} ${Math.abs(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function MoneyInput({
  id,
  label,
  value,
  onChange,
  currency = "USD",
  minCents,
  maxCents,
  error,
  hint,
  disabled,
  className,
}: MoneyInputProps) {
  const amount = Number.parseFloat(value);
  const cents = Number.isFinite(amount) ? Math.round(amount * 100) : null;

  let validation: { tone: "danger" | "success"; text: string } | null = null;
  if (cents !== null && cents > 0) {
    if (minCents !== undefined && cents < minCents) {
      validation = { tone: "danger", text: `Minimum is ${formatAmount(minCents, currency)}.` };
    } else if (maxCents !== undefined && cents > maxCents) {
      validation = { tone: "danger", text: `Maximum is ${formatAmount(maxCents, currency)}.` };
    } else if (minCents !== undefined || maxCents !== undefined) {
      validation = { tone: "success", text: "Amount is within the available limits." };
    }
  }

  const describedBy = error ? `${id}-error` : validation ? `${id}-validation` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error) || validation?.tone === "danger"}
          aria-describedby={describedBy}
          className={cn(
            "min-h-12 w-full rounded-xl border bg-white px-4 pr-16 font-mono text-base font-medium tabular-nums text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900",
            error || validation?.tone === "danger"
              ? "border-red-300 focus:border-red-500 focus-visible:ring-red-500/15 dark:border-red-800"
              : "border-slate-200 focus:border-emerald-700 focus-visible:ring-emerald-700/15 dark:border-slate-700 dark:focus:border-emerald-400 dark:focus-visible:ring-emerald-400/15",
          )}
        />
        <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {currency}
        </span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-red-700 dark:text-red-300">{error}</p>
      ) : validation ? (
        <p id={`${id}-validation`} className={cn("text-xs", validation.tone === "danger" ? "font-medium text-red-700 dark:text-red-300" : "text-emerald-800 dark:text-emerald-300")}>
          {validation.text}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
