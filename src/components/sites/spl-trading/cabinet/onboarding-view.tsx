import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  FileText,
  Landmark,
  WalletCards,
} from "lucide-react";

const GUIDES = [
  {
    number: "01",
    title: "Review fees and limits",
    body: "Check the default deposit range, withdrawal fee, and order expiry. Values shown in your cabinet take precedence.",
    href: "/fees",
    cta: "Review fees",
    icon: FileText,
  },
  {
    number: "02",
    title: "Understand the transfer risks",
    body: "Confirm the asset, network, address, and amount every time. A blockchain transfer sent incorrectly may not be recoverable.",
    href: "/risk",
    cta: "Read the disclosure",
    icon: CircleAlert,
  },
  {
    number: "03",
    title: "Open the deposit flow",
    body: "Create an order only when deposits are available in your deployment. Receiving details stay inside the signed-in dialog.",
    href: "/",
    cta: "Go to overview",
    icon: WalletCards,
  },
  {
    number: "04",
    title: "Keep the records close",
    body: "Use the deposit, payout, and report pages to follow references and review the records currently associated with your account.",
    href: "/report",
    cta: "View reports",
    icon: BookOpenCheck,
  },
] as const;

export function OnboardingView() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section>
        <div className="mb-4 max-w-2xl">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
            A practical starting point for the cabinet. These are reference links, not a completion tracker; account features depend on the deployment settings.
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <li key={guide.number} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold tracking-[0.12em] text-emerald-700 dark:text-emerald-400">{guide.number}</span>
                  <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                </div>
                <h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">{guide.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{guide.body}</p>
                <Link href={guide.href} className="mt-5 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-emerald-800 transition hover:gap-2.5 dark:text-emerald-300">
                  {guide.cta}<ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Landmark className="size-[18px]" aria-hidden />
          </span>
          <h2 className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Payout destinations</h2>
          <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
            Payout addresses are entered with a request and are not stored on this page. Payouts unlock after at least $500 has been credited and are manually reviewed.
          </p>
          <Link href="/accounts" className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Open accounts<ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900/70 dark:bg-emerald-950/30">
          <h2 className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Need a hand?</h2>
          <p className="mt-2 text-xs leading-5 text-emerald-900/75 dark:text-emerald-200/75">
            Support options vary by deployment. Use a verified contact path supplied by your platform operator.
          </p>
          <Link href="/support" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-emerald-900 underline-offset-2 hover:underline dark:text-emerald-200">
            View support options<ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      </aside>
    </div>
  );
}
