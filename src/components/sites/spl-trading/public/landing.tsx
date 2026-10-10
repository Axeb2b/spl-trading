import Link from "next/link";
import {
  ArrowUpFromLine,
  FileText,
  Landmark,
  ListChecks,
  Users,
  Wallet,
  Rocket,
  CreditCard,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LandingHero } from "./landing-hero";
import { PublicCard, PublicSection } from "./public-shell";
import { AUTH_LINKS } from "./public-links";

const STEPS: { n: string; title: string; body: string; icon: LucideIcon }[] = [
  {
    n: "01",
    title: "Create your account",
    body: "Sign up with your name, email and a password. A referral code can be added only if someone invited you.",
    icon: Rocket,
  },
  {
    n: "02",
    title: "Work through onboarding",
    body: "The cabinet's checklist covers connecting Telegram, making a first deposit and adding a payout account.",
    icon: ListChecks,
  },
  {
    n: "03",
    title: "Fund with USDT",
    body: "Enter an amount to create a deposit order. The receiving address and QR code then appear in the deposit dialog — never on these public pages.",
    icon: CreditCard,
  },
  {
    n: "04",
    title: "Request a payout",
    body: "Add the account to pay out to, ask for a withdrawal, and follow it from pending through to settled. Fees and limits are listed on the Fees page.",
    icon: ArrowUpFromLine,
  },
];

const FEATURES: { title: string; icon: LucideIcon; body: string }[] = [
  {
    title: "Deposits",
    icon: Wallet,
    body: "Create a deposit order, send USDT on BEP-20, and your balance is credited once the transfer has been verified. Orders that go unpaid expire.",
  },
  {
    title: "Payouts",
    icon: ArrowUpFromLine,
    body: "Ask for a payout to an account you control. Each request carries its own fee and reference and moves through pending, approved, processing, completed — or is rejected with a reason.",
  },
  {
    title: "Accounts",
    icon: Landmark,
    body: "Keep the bank accounts and e-wallets your payouts should reach, so every request routes to a destination you already saved.",
  },
  {
    title: "Reports",
    icon: FileText,
    body: "Read deposits, withdrawals and the entries recorded behind them in one place, with gross totals and fees side by side.",
  },
  {
    title: "Onboarding",
    icon: ListChecks,
    body: "A guided checklist for the steps that get an account ready, from the Telegram connection through to your first payout account.",
  },
  {
    title: "Referrals",
    icon: Users,
    body: "Invite other accounts with a referral code. A reward is recorded when a referred account has a qualifying credited deposit and is paid only after approval.",
  },
];

export function Landing() {
  return (
    <>
      <LandingHero />

      <PublicSection
        index="01 — Getting started"
        title="How it works"
        lede="Four steps from signup to a settled payout, each one taking place inside your cabinet."
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="group relative rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:shadow-blue-500/10"
            >
              <span className="absolute right-4 top-4 text-3xl font-semibold tracking-tight text-slate-200 dark:text-slate-700 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                {step.n}
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 group-hover:bg-blue-500 group-hover:text-white group-hover:ring-blue-500 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900 dark:group-hover:bg-blue-500 dark:group-hover:text-white dark:group-hover:ring-blue-500 transition-colors">
                <step.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </PublicSection>

      <PublicSection
        index="02 — In the cabinet"
        title="What the cabinet does"
        lede="Six areas, each with a job. Feature availability depends on platform configuration, so a feature may be off when you arrive."
        className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <PublicCard
              key={feature.title}
              title={feature.title}
              icon={<feature.icon className="size-4" aria-hidden />}
            >
              {feature.body}
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <PublicSection
        index="03 — Before you fund"
        title="Good to know"
        lede="Three things worth reading before an account is funded."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Fees are published" href="/fees">
            Deposit minimums and maximums, the withdrawal fee and the minimum payout are listed on
            the Fees page, and the current limits are shown again in the deposit dialog.
          </PublicCard>
          <PublicCard title="Features can be off" href="/risk">
            Deposits, withdrawals, referrals and investment features are switched off by default and
            are enabled per platform configuration — and can be disabled again at any time.
          </PublicCard>
          <PublicCard title="Support stays in-app" href="/support">
            Support runs through the cabinet and Telegram. This public site publishes no phone
            number and no email address.
          </PublicCard>
        </div>
      </PublicSection>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:ring-1 dark:ring-white/10">
        {/* Subtle background texture that reads differently in dark mode */}
        <div aria-hidden className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40 dark:opacity-20" />
        <div className="relative z-[1] mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl lg:text-4xl">
              Ready to move your USDT?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-blue-50 dark:text-slate-300">
              Create an account in under a minute. Fund with USDT on BEP-20, request payouts to
              accounts you control, and follow every movement in a plain, itemised ledger.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={AUTH_LINKS.signUp.href}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/25 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
              >
                Create account
                <Rocket className="size-4" aria-hidden />
              </Link>
              <Link
                href={AUTH_LINKS.signIn.href}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
        <div className={cn("px-4 py-12 sm:px-6 lg:px-8")}>
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              What every user notices first
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: CheckCircle2,
                  title: "No promised returns",
                  body: "This is a money-movement cabinet. No yield, no profit, no interest is offered — just deposits, payouts and an honest ledger.",
                  highlight: "honest",
                },
                {
                  icon: Landmark,
                  title: "You keep control",
                  body: "Every payout goes to an account you add and own. Addresses never appear on public pages — only inside your cabinet.",
                  highlight: "control",
                },
                {
                  icon: FileText,
                  title: "Everything is recorded",
                  body: "Deposits, withdrawals and the double-entry ledger entries behind them — gross totals and fees side by side, forever.",
                  highlight: "recorded",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
