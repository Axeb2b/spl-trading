import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BookOpenCheck,
  Check,
  CircleDot,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { BrandLockup } from "../brand";
import { AUTH_LINKS } from "./public-links";
import styles from "./public.module.css";

const PREVIEW_ROWS = [
  { title: "Deposit orders", detail: "Review each payment status", icon: ArrowDownToLine },
  { title: "Payout requests", detail: "Follow review through settlement", icon: ArrowUpFromLine },
  { title: "Account activity", detail: "Reconcile from one ledger", icon: BookOpenCheck },
] as const;

const rise = (delayMs: number) => ({ animationDelay: `${delayMs}ms` });

function ProductPreview() {
  return (
    <div className={`relative mx-auto w-full max-w-[560px] ${styles.rise}`} style={rise(160)}>
      <div aria-hidden className={`absolute -inset-5 rounded-[2.5rem] border border-lime-100/10 ${styles.orbit}`} />
      <div aria-hidden className="absolute -right-10 -top-12 size-48 rounded-full bg-lime-300/15 blur-3xl" />
      <div className="absolute -bottom-8 -left-8 size-40 rounded-full bg-teal-400/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#0d2922]/90 shadow-[0_32px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <div aria-hidden className={`absolute inset-0 opacity-60 ${styles.heroGrid}`} />
        <div className="relative">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
            <BrandLockup inverse compact />
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-200/15 bg-lime-200/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime-100">
              <CircleDot className="size-3" aria-hidden />
              Illustrative preview
            </span>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-100/60">Workspace overview</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl">
                  Every movement, in view.
                </h2>
              </div>
              <span className="w-fit rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-white/65">
                No live account data
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-h-[170px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-lime-200/10 text-lime-200">
                    <WalletCards className="size-[18px]" aria-hidden />
                  </span>
                  <ShieldCheck className="size-[18px] text-emerald-200/70" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-white/55">Account records</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-white">
                    Clear by design
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Orders, statuses and ledger entries stay connected.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <p className="text-xs font-medium text-white/80">Your activity, organized</p>
                  <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-mono text-white/70">SAMPLE</span>
                </div>
                <ul className="divide-y divide-white/[0.08]">
                  {PREVIEW_ROWS.map((row) => (
                    <li key={row.title} className="flex items-center gap-3 px-4 py-3.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-lime-100">
                        <row.icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white/90">{row.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-white/50">{row.detail}</p>
                      </div>
                      <Check className="size-4 shrink-0 text-emerald-200/65" aria-hidden />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lime-100/10 bg-lime-200/[0.055] px-4 py-3">
              <p className="text-xs leading-5 text-emerald-50/75">
                Fees and limits are visible before you create an order.
              </p>
              <Link href="/fees" className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-100 transition hover:text-white">
                View fees <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className={`relative isolate overflow-hidden bg-[#09201b] text-white ${styles.grain}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-0 opacity-70 ${styles.heroGrid}`} />
        <div className="absolute -left-40 -top-36 size-[34rem] rounded-full bg-emerald-600/20 blur-[90px]" />
        <div className="absolute -right-28 bottom-[-15rem] size-[34rem] rounded-full bg-lime-300/10 blur-[100px]" />
      </div>

      <div className="relative z-[2] mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 lg:py-24 xl:py-28">
        <div className="max-w-2xl">
          <div className={`flex items-center gap-3 ${styles.rise}`} style={rise(0)}>
            <span className="h-px w-8 bg-lime-200/70" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lime-100/80">
              A clearer way to move funds
            </p>
          </div>

          <h1
            className={`mt-6 text-[2.65rem] font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-5xl lg:text-[3.6rem] xl:text-[4rem] ${styles.rise}`}
            style={rise(70)}
          >
            Know where every transfer stands.
          </h1>

          <p
            className={`mt-6 max-w-xl text-[15px] leading-7 text-emerald-50/70 sm:text-lg sm:leading-8 ${styles.rise}`}
            style={rise(140)}
          >
            One focused cabinet for USDT deposit orders, payout requests, and the transaction records that tie them together.
          </p>

          <div className={`mt-8 flex flex-col gap-3 sm:flex-row ${styles.rise}`} style={rise(210)}>
            <Link
              href={AUTH_LINKS.signUp.href}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lime-300 px-6 text-sm font-semibold text-emerald-950 shadow-[0_8px_30px_rgba(190,243,109,0.14)] transition hover:-translate-y-0.5 hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-100/70"
            >
              {AUTH_LINKS.signUp.label}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/product"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.035] px-6 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.08]"
            >
              Explore the product
            </Link>
          </div>

          <div className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-emerald-50/55 ${styles.rise}`} style={rise(280)}>
            <span className="inline-flex items-center gap-2">
              <Check className="size-3.5 text-lime-200" aria-hidden />
              Fees shown upfront
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="size-3.5 text-lime-200" aria-hidden />
              Statuses you can follow
            </span>
          </div>

          <p className={`mt-7 max-w-lg text-xs leading-5 text-emerald-50/70 ${styles.rise}`} style={rise(340)}>
            SPL Trading is a money-movement service, not an investment product. No return, yield, or profit is promised.{" "}
            <Link href="/risk" className="font-medium text-emerald-50/75 underline decoration-white/25 underline-offset-4 transition hover:text-white">
              Read the risk disclosure
            </Link>
            .
          </p>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
