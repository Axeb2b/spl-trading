import type { Metadata } from "next";
import { SEO } from "@/components/sites/spl-trading/public/seo";
import Link from "next/link";
import { PublicPageIntro, PublicSection, PublicShell } from "@/components/sites/spl-trading/public/public-shell";

export const metadata: Metadata = SEO.default({
      title: "Fees & limits",
      description: "Published fees and limits for SPL Trading: withdrawal fee, deposit minimum and maximum, payout minimum and deposit order expiry.",
      path: "/fees",
    });

type FeeRow = { item: string; amount: string; note: string };

const FEE_ROWS: FeeRow[] = [
  {
    item: "Withdrawal fee",
    amount: "1.00%",
    note: "Charged on the amount you request, so the payout settles net of the fee. This is the product's default setting.",
  },
  {
    item: "Minimum withdrawal",
    amount: "$10.00",
    note: "A request below this is refused before it reaches review.",
  },
  {
    item: "Minimum deposit",
    amount: "$500.00",
    note: "Default. The deposit dialog shows the figure that applies to you before you create an order.",
  },
  {
    item: "Maximum deposit",
    amount: "$1,000,000.00",
    note: "Default. Also shown in the deposit dialog alongside the minimum.",
  },
  {
    item: "Deposit order expiry",
    amount: "30 minutes",
    note: "An order that isn't paid within this window lapses and a new one has to be created.",
  },
  {
    item: "Account creation",
    amount: "No charge",
    note: "Nothing in the product charges for opening an account.",
  },
];

export default function FeesPage() {
  return (
    <PublicShell>
      <PublicPageIntro
        eyebrow="Fees"
        title="Fees and limits, in plain numbers"
        lede="Everything the product charges is set as a platform setting, not buried in a clause. The table below is the current default; the figures shown in your cabinet when you act are the ones that apply."
      />

      <PublicSection index="01 — The numbers" title="What the product charges">
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                <th className="px-4 py-3 font-medium text-slate-500">Item</th>
                <th className="px-4 py-3 font-medium text-slate-500">Amount</th>
                <th className="px-4 py-3 font-medium text-slate-500">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {FEE_ROWS.map((row) => (
                <tr key={row.item} className="align-top">
                  <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-50">
                    {row.item}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-slate-900 tabular-nums dark:text-slate-50">
                    {row.amount}
                  </td>
                  <td className="px-4 py-3.5 leading-relaxed text-slate-600 dark:text-slate-400">
                    {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Amounts are entered and recorded in USD. Deposits are funded in USDT, and the deposit
          dialog shows the amount to send next to the figure you entered. The fee on a withdrawal is
          listed in the Fee column of your payout history, next to the request it belongs to.
        </p>
      </PublicSection>

      <PublicSection
        index="02 — How they are set"
        title="Configured, not hardcoded"
        lede="Deposit minimum, deposit maximum and the withdrawal fee are stored as platform configuration values. An operator can change them, which is why the figures shown inside your cabinet take precedence over anything printed on a public page."
        className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            If a fee or limit changes, it changes for every account at the same moment, and the new
            figure appears in the dialog before you confirm a request. You are never charged an
            amount that wasn&apos;t displayed to you first.
          </p>
        </div>
      </PublicSection>

      <PublicSection
        index="03 — Network fees"
        title="Blockchain fees are separate"
        lede="A transfer on BNB Smart Chain carries a network fee. That fee is set by the chain and by whatever wallet or exchange you send from — it is not collected by SPL Trading and is not part of the withdrawal fee above."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Sending USDT from your own wallet or exchange may attract a fee they set and keep.",
            "The withdrawal fee above is the only charge the product itself applies to a payout.",
            "No gas or network fee is added on top of a payout by the platform.",
            "If your wallet quotes you a network fee, that quote comes from your wallet, not from us.",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            >
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-500" />
              {item}
            </li>
          ))}
        </ul>
      </PublicSection>

      <PublicSection
        index="04 — Not on this page"
        title="Anything else is shown in-app"
        lede="If a cost or limit is not listed above, it is not defined on a public page either — check the dialog or form you are about to confirm, where the applicable figures are displayed before you commit."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/product"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            How deposits work
          </Link>
          <Link
            href="/risk"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Read the risk disclosure
          </Link>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
