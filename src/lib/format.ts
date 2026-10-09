/** Pure display formatters. All money values are integer cents. */

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const LEDGER_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  fee: "Fee",
  referral_reward: "Referral reward",
  adjustment: "Adjustment",
};

/** Human label for a ledger transaction type. */
export function ledgerTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return LEDGER_LABELS[type] ?? type;
}
