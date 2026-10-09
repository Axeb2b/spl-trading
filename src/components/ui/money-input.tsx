import { cn } from "@/lib/utils";

const UNITS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "USDT", label: "USDT — Tether" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "EUR", label: "EUR — Euro" },
] as const;

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

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  let validation: { tone: "danger" | "warning" | "success"; text: string } | null = null;
  if (cents !== null && cents > 0) {
    if (minCents !== undefined && cents < minCents) {
      validation = { tone: "danger", text: `Minimum is ${formatUsd(minCents)} ${currency}.` };
    } else if (maxCents !== undefined && cents > maxCents) {
      validation = { tone: "danger", text: `Maximum is ${formatUsd(maxCents)} ${currency}.` };
    } else {
      validation = { tone: "success", text: "Amount within limits." };
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
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
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition",
            "focus-visible:ring-2 focus-visible:ring-blue-500/40",
            "disabled:cursor-not-allowed disabled:bg-slate-50",
            error || validation?.tone === "danger"
              ? "border-red-300 focus-visible:ring-red-500/40"
              : "border-slate-300",
          )}
        />
        <select
          aria-label={`${label} currency`}
          defaultValue={currency}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          {UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.value}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : validation ? (
        <p
          className={cn(
            "text-xs",
            validation.tone === "danger"
              ? "text-red-600"
              : validation.tone === "warning"
                ? "text-amber-600"
                : "text-emerald-600",
          )}
        >
          {validation.text}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}