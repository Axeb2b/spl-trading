import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { ReportView, type LedgerRow } from "@/components/sites/spl-trading/cabinet/report-view";
import { requirePageUser } from "@/lib/page-user";
import { getUserLedgerEntries } from "@/lib/ledger";

export const metadata: Metadata = {
  title: "Report",
  description: "Export and review transaction reports",
};

type RawLedgerEntry = {
  id: string;
  direction: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  type: string;
  description: string | null;
  provider_ref: string | null;
};

export default async function ReportPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  const entries = getUserLedgerEntries(user.id, 200) as RawLedgerEntry[];

  const rows: LedgerRow[] = entries.map((entry) => ({
    reference: entry.provider_ref ?? entry.id.slice(0, 8).toUpperCase(),
    type: entry.type,
    // Credit increases the user's cash; a debit reduces it.
    amountCents: entry.direction === "credit" ? entry.amount_cents : -entry.amount_cents,
    currency: entry.currency,
    description: entry.description ?? "",
    createdAt: entry.created_at,
  }));

  return (
    <CabinetShell title="Report" email={user.email} name={user.name}>
      <ReportView rows={rows} />
    </CabinetShell>
  );
}
