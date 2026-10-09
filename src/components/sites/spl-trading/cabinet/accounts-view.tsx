import { CreditCard } from "lucide-react";
import { Toolbar } from "./view-primitives";
import { EmptyState } from "@/components/ui/empty-state";

export function AccountsView() {
  return (
    <>
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Payout accounts
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Bank accounts and wallets used to settle withdrawals.
        </p>
      </header>

      <Toolbar placeholder="Search accounts…" />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <EmptyState
          icon={CreditCard}
          title="No payout accounts yet"
          description="Payout account management is not implemented yet. A verified payout account will be required before a withdrawal can be requested."
        />
      </div>
    </>
  );
}
