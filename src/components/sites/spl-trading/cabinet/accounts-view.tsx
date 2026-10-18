import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function AccountsView() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Landmark className="size-[18px]" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Payout destinations</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              The cabinet does not save payout addresses. When your account has at least $500 in verified deposits and payouts are enabled, enter your own BEP-20 address in the payout request form.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
        <EmptyState
          icon={Landmark}
          title="No saved payout address"
          description="For privacy, a destination is entered with each payout request rather than stored on this page. Payouts are manually reviewed and are not sent automatically."
          action={
            <Link href="/payouts" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <ArrowRight className="size-3.5" aria-hidden />
              View payout options
            </Link>
          }
        />
      </div>
    </div>
  );
}
