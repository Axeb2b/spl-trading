import Link from "next/link";
import {
  ArrowUpFromLine,
  FileText,
  Landmark,
  ListChecks,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { LandingHero } from "./landing-hero";
import { PublicCard, PublicSection } from "./public-shell";
import { AUTH_LINKS } from "./public-links";

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Create your account",
    body: "Sign up with your name, email and a password. A referral code can be added only if someone invited you.",
  },
  {
    n: "02",
    title: "Work through onboarding",
    body: "The cabinet's checklist covers connecting Telegram, making a first deposit and adding a payout account.",
  },
  {
    n: "03",
    title: "Fund with USDT",
    body: "Enter an amount to create a deposit order. The receiving address and QR code then appear in the deposit dialog — never on these public pages.",
  },
  {
    n: "04",
    title: "Request a payout",
    body: "Add the account to pay out to, ask for a withdrawal, and follow it from pending through to settled. Fees and limits are listed on the Fees page.",
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
              className="relative rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="font-mono text-3xl font-semibold tracking-tight text-slate-200 dark:text-slate-700">
                {step.n}
              </span>
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
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

      <section className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Open your cabinet
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              Create an account to get started, or sign in if you already have one. Public pages
              stay readable either way.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={AUTH_LINKS.signUp.href}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              {AUTH_LINKS.signUp.label}
            </Link>
            <Link
              href={AUTH_LINKS.signIn.href}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {AUTH_LINKS.signIn.label}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
