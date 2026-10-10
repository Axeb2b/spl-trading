import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpFromLine,
  FileText,
  Landmark,
  ListChecks,
  Users,
  Wallet,
} from "lucide-react";
import {
  PublicCard,
  PublicPageIntro,
  PublicSection,
  PublicShell,
} from "@/components/sites/spl-trading/public/public-shell";

export const metadata: Metadata = {
  title: "Product",
  description:
    "What the SPL Trading cabinet does: deposits, payouts, accounts, reports, onboarding and referrals, and how a deposit moves.",
};

const MODULES = [
  {
    title: "Deposits (pay-ins)",
    icon: Wallet,
    body: "You create a deposit order for an amount, send USDT on the BEP-20 network to the address shown in the dialog, and the balance is credited once the transfer has been independently verified. Unpaid orders expire and have to be created again.",
  },
  {
    title: "Withdrawals (payouts)",
    icon: ArrowUpFromLine,
    body: "You request a payout to an account you have already saved. The request carries its own fee and reference and moves through pending, approved, processing and completed — or it is rejected with a reason and the hold released back to your balance.",
  },
  {
    title: "Accounts",
    icon: Landmark,
    body: "The destinations your payouts reach: bank accounts and e-wallets stored once and reused, so a payout request always points at something you set up deliberately.",
  },
  {
    title: "Reports",
    icon: FileText,
    body: "Deposits, payouts and the ledger entries behind them, listed together with gross totals and the fees taken — the same records the account balance is built from.",
  },
  {
    title: "Onboarding",
    icon: ListChecks,
    body: "A guided checklist covering the steps that get an account ready: connecting Telegram, funding it, adding a payout account and working through the remaining setup items.",
  },
  {
    title: "Referrals",
    icon: Users,
    body: "A referral code at sign-up links the new account to yours. A reward is recorded when a referred account has a qualifying credited deposit and is paid only after approval; the feature is off unless the platform turns it on.",
  },
];

const DEPOSIT_STEPS = [
  "Sign in. Deposit addresses are only served to signed-in sessions — nothing is published on these public pages.",
  "Open the deposit dialog and enter an amount. The dialog shows the current minimum and maximum before you commit.",
  "Create the deposit order. You get a reference in the form DEP-…, and the order carries an expiry: an unpaid order lapses.",
  "Send USDT on BEP-20 to the address shown, using the QR code or the copied address, and send the exact amount requested.",
  "Wait for verification. The transfer is checked before your balance is credited — it is not credited on your word alone.",
  "Follow it in your reports, where the order keeps its status until it is credited.",
];

export default function ProductPage() {
  return (
    <PublicShell>
      <PublicPageIntro
        eyebrow="Product"
        title="What the cabinet does"
        lede="Six areas cover the whole flow: getting money in, keeping the destinations you pay out to, getting money out, and reading exactly what happened."
      />

      <PublicSection index="01 — Modules" title="The areas of the cabinet">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <PublicCard
              key={module.title}
              title={module.title}
              icon={<module.icon className="size-4" aria-hidden />}
            >
              {module.body}
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection
        index="02 — Deposits"
        title="How a deposit moves"
        lede="At a high level, without publishing a receiving address on a public page."
        className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <ol className="grid gap-3">
          {DEPOSIT_STEPS.map((step, index) => (
            <li
              key={step}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-900 font-mono text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/60">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
            Where the address comes from
          </p>
          <p className="mt-2 text-sm leading-relaxed text-blue-800 dark:text-blue-300">
            The receiving address is a platform setting, served to the deposit dialog together with
            a QR code for the transfer. It is deliberately absent from this site, so that nothing
            published here can go stale or be imitated elsewhere.
          </p>
        </div>
      </PublicSection>

      <PublicSection
        index="03 — Availability"
        title="Features may be off when you arrive"
        lede="Deposits, withdrawals, referrals and investment features are disabled by default. An operator has to switch each one on for the platform, and any of them can be switched off again — including while you are mid-flow."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <PublicCard title="Check before you plan around it" className="sm:flex-1">
            If a feature is off, the cabinet says so rather than failing silently: you will see a
            clear message that the action is currently disabled.
          </PublicCard>
          <PublicCard title="Fees and limits are separate" className="sm:flex-1">
            Availability and pricing are different questions.{" "}
            <Link
              href="/fees"
              className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              See the Fees page
            </Link>{" "}
            for the amounts that apply.
          </PublicCard>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
