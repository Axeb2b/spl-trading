/** Pure display formatters. All money values are integer cents. */

import { formatIst } from "@/lib/time/ist";

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Timestamps are stored in UTC and displayed in Asia/Kolkata (IST, UTC+05:30).
 *
 * The previous implementation used `toLocaleString("en-US", …)`, which renders
 * in the *server's* zone (UTC on Workers) with no offset and no suffix — so
 * every timestamp in the cabinet was ambiguous. IST is a fixed +05:30 offset
 * with no DST, so the conversion is exact arithmetic.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatIst(iso, "full");
  } catch {
    return "—";
  }
}

/** Date-only IST label — `21 Oct 2026`. */
export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return formatIst(iso, "date");
  } catch {
    return "—";
  }
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
