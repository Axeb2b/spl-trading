import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BookOpenCheck,
  CircleDollarSign,
  CircleHelp,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { LandingHero } from "./landing-hero";
import { PublicCard, PublicSection } from "./public-shell";
import { AUTH_LINKS } from "./public-links";

const STEPS = [
  {
    number: "01",
    title: "Create your account",
    body: "Set up a sign-in and open your private cabinet. No deposit address is published on these public pages.",
  },
  {
    number: "02",
    title: "Review the order details",
    body: "When deposits are enabled, choose an amount and review the network, address, limits, and expiry before sending.",
  },
  {
    number: "03",
    title: "Follow the status",
    body: "Each order has a reference and a status. A deposit is credited only after it has been independently verified.",
  },
  {
    number: "04",
    title: "Read the ledger",
    body: "Review deposits, payout requests, and recorded fees in the reports area. Payouts are subject to review and availability.",
  },
] as const;

const FEATURES = [
  {
    title: "Deposit orders",
    icon: ArrowDownToLine,
    body: "When enabled, create a USDT order on BNB Smart Chain (BEP-20). The minimum is $500; the receiving address appears only after an order is created, and credit follows manual verification.",
  },
  {
    title: "Payout requests",
    icon: ArrowUpFromLine,
    body: "After at least $500 in deposits is verified and credited, request a BEP-20 payout where the operator has enabled the feature. Requests are manually reviewed and not sent automatically.",
  },
  {
    title: "A readable ledger",
    icon: BookOpenCheck,
    body: "See recorded deposits, payouts, and fees together. Amounts are shown in USD with the transaction reference and status beside them.",
  },
  {
    title: "Account destinations",
    icon: Landmark,
    body: "Enter the BEP-20 destination with each payout request. This build does not save payout addresses to the account, so verify the address every time.",
  },
] as const;

export function Landing() {
  return (
    <>
      <LandingHero />

      <section className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-7 sm:px-8 md:grid-cols-2 md:gap-8 lg:grid-cols-4 lg:py-8">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShieldCheck className="size-[18px]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Private by default</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Deposit details stay inside your signed-in session.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <BookOpenCheck className="size-[18px]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Records in context</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">References, states, amounts, and fees stay connected.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CircleDollarSign className="size-[18px]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">$500 verified threshold</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">At least $500 must be credited before payout requests unlock.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CircleHelp className="size-[18px]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Availability is explicit</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Money-movement features may be off in some deployments.</p>
            </div>
          </div>
        </div>
      </section>

      <PublicSection
        index="01 — The cabinet"
        title="Everything important, without the noise."
        lede="SPL Trading is built around money movement and clear records—not market charts or promised performance."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature) => (
            <PublicCard
              key={feature.title}
              title={feature.title}
              icon={<feature.icon className="size-[18px]" aria-hidden />}
            >
              {feature.body}
            </PublicCard>
          ))}
        </div>
      </PublicSection>

      <section className="border-y border-slate-200/80 bg-[#eef4ef] dark:border-slate-800 dark:bg-slate-900/45">
        <PublicSection
          index="02 — How it works"
          title="A flow you can follow."
          lede="Each step gives you the context for the next one—from order details to the ledger entry."
        >
          <ol className="grid gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
            {STEPS.map((step, index) => (
              <li
                key={step.number}
                className={`relative p-5 sm:p-6 ${index > 0 ? "border-t border-slate-200 sm:border-t-0 sm:border-l dark:border-slate-800" : ""} ${index > 1 ? "xl:border-l" : ""}`}
              >
                <p className="font-mono text-xs font-semibold tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
                  {step.number}
                </p>
                <h3 className="mt-4 text-base font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </PublicSection>
      </section>

      <PublicSection
        index="03 — Before you fund"
        title="Know the details before you act."
        lede="Read the current fees, understand the transfer risks, and only rely on controls that appear in your own cabinet."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <PublicCard title="Fees & limits" href="/fees">
            Review the default fee schedule, deposit limits, and order expiry. The values shown in your cabinet are the ones that apply to your request.
          </PublicCard>
          <PublicCard title="Risk disclosure" href="/risk">
            Digital-asset transfers can be irreversible. Check the asset, network, destination, and amount every time before you send.
          </PublicCard>
          <PublicCard title="Get support" href="/support">
            Find the available support path and the details to include if you need help with an order or account.
          </PublicCard>
        </div>
      </PublicSection>

      <section className="bg-[#0c1d18] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-12 sm:px-8 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-200/80">SPL Trading</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Bring your account activity into focus.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Create an account to view your cabinet. Deposits, payouts, and referrals remain subject to the controls enabled for your deployment.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={AUTH_LINKS.signUp.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-lime-200"
            >
              {AUTH_LINKS.signUp.label}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href={AUTH_LINKS.signIn.href}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {AUTH_LINKS.signIn.label}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
