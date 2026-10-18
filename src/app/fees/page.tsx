import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { PublicPageIntro, PublicSection, PublicShell } from "@/components/sites/spl-trading/public/public-shell";

export const metadata: Metadata = {
  title: "Fees & limits",
  description:
    "Published default fees and limits for SPL Trading: withdrawal fee, deposit minimum and maximum, payout minimum and deposit order expiry.",
};

type FeeRow = { item: string; amount: string; note: string };

const FEE_ROWS: FeeRow[] = [
  {
    item: "Withdrawal fee",
    amount: "1.00%",
    note: "Charged on the amount requested, so the payout settles net of the fee. This is the default platform setting.",
  },
  {
    item: "Minimum withdrawal",
    amount: "$10.00",
    note: "A request below this amount is refused before it reaches review.",
  },
  {
    item: "Minimum deposit",
    amount: "$500.00",
    note: "Default minimum. The deposit dialog shows the value that applies before an order is created.",
  },
  {
    item: "Maximum deposit",
    amount: "$100,000.00",
    note: "Default maximum. The deposit dialog also shows the value that applies to your account.",
  },
  {
    item: "Deposit order expiry",
    amount: "30 minutes",
    note: "A transfer must be made before the order expires. An operator checks its on-chain timestamp before crediting; sending after expiry is not credited to that order.",
  },
  {
    item: "Account creation",
    amount: "No charge",
    note: "There is no platform fee for opening an account.",
  },
];

export default function FeesPage() {
  return (
    <PublicShell>
      <PublicPageIntro
        eyebrow="Fees & limits"
        title="The numbers, before you move funds."
        lede="These are the current default settings—not a substitute for the values shown in your cabinet. The figures shown in the order flow are the ones that apply to your request."
      />

      <PublicSection
        index="01 — The schedule"
        title="Default fees and limits"
        lede="Amounts are entered and recorded in USD. Deposits are funded in USDT."
      >
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.025] md:block dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Default SPL Trading fees and limits</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/50">
                <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Item</th>
                <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Default</th>
                <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {FEE_ROWS.map((row) => (
                <tr key={row.item} className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <th scope="row" className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {row.item}
                  </th>
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-sm font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
                    {row.amount}
                  </td>
                  <td className="px-5 py-4 leading-6 text-slate-600 dark:text-slate-400">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:hidden">
          {FEE_ROWS.map((row) => (
            <article key={row.item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{row.item}</h3>
                <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">{row.amount}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{row.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-100">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Platform settings can change. Confirm the amount, network, fee, and expiry shown in your cabinet before you proceed.
          </p>
        </div>
      </PublicSection>

      <section className="border-y border-slate-200/80 bg-[#eef4ef] dark:border-slate-800 dark:bg-slate-900/45">
        <PublicSection
          index="02 — Network costs"
          title="Blockchain fees are separate"
          lede="A transfer on BNB Smart Chain carries a network fee. That fee is set by the chain and by the wallet or exchange you send from; it is not an SPL Trading fee."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Your wallet or exchange may charge its own fee when you send USDT.",
              "The withdrawal fee above is the platform fee applied to a payout request.",
              "A network fee quote comes from the wallet or exchange, not from this website.",
              "If a request shows a different fee in your cabinet, the in-app value takes precedence.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                {item}
              </div>
            ))}
          </div>
        </PublicSection>
      </section>

      <PublicSection
        index="03 — Next"
        title="Understand the flow before you start."
        lede="Check what the cabinet supports in your deployment, and understand the risks of irreversible network transfers."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/product"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200"
          >
            How the product works <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/risk"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Read the risk disclosure
          </Link>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
