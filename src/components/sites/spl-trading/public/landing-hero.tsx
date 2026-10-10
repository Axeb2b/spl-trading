import Link from "next/link";
import { FileText, Landmark, Wallet, ArrowUpFromLine, ArrowRight } from "lucide-react";
import { AUTH_LINKS } from "./public-links";
import styles from "./public.module.css";

const PANEL_ROWS = [
  { label: "Deposits", detail: "USDT on the BEP-20 network", icon: Wallet },
  { label: "Payouts", detail: "sent to accounts you add", icon: ArrowUpFromLine },
  { label: "Accounts", detail: "your payout destinations", icon: Landmark },
  { label: "Reports", detail: "deposits, payouts and ledger entries", icon: FileText },
] as const;

const rise = (delayMs: number) => ({ animationDelay: `${delayMs}ms` });

export function LandingHero() {
  return (
    <section
      className={`relative overflow-hidden bg-slate-900 text-white ${styles.grain}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className={`${styles.dots} absolute inset-0`} />
        <div className="absolute -left-24 -top-32 size-[30rem] rounded-full bg-blue-500/25 blur-3xl pulse" />
        <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-emerald-400/10 blur-3xl pulse" />
      </div>

      <div className="relative z-[2] mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:py-28">
        <div>
          <p
            className={`font-mono text-xs uppercase tracking-[0.2em] text-blue-300 ${styles.rise}`}
            style={rise(0)}
          >
            SPL Trading · trader cabinet
          </p>

          <h1
            className={`mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-6xl ${styles.rise}`}
            style={rise(80)}
          >
            Deposits, payouts and reports — in one cabinet.
          </h1>

          <p
            className={`mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg ${styles.rise}`}
            style={rise(160)}
          >
            SPL Trading is where you move money in and out of your account: fund it with USDT on BNB
            Smart Chain, keep the accounts you pay out to, and follow every movement in a plain,
            itemised ledger.
          </p>

          <div
            className={`mt-8 flex flex-col gap-3 sm:flex-row ${styles.rise}`}
            style={rise(240)}
          >
            <Link
              href={AUTH_LINKS.signUp.href}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              {AUTH_LINKS.signUp.label}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href={AUTH_LINKS.signIn.href}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {AUTH_LINKS.signIn.label}
            </Link>
          </div>

          <p
            className={`mt-7 max-w-lg text-sm leading-relaxed text-slate-400 ${styles.rise}`}
            style={rise(320)}
          >
            This is a money-movement cabinet, not an investment product: no return, yield or profit
            is offered or promised.{" "}
            <Link
              href="/risk"
              className="font-medium text-slate-200 underline-offset-4 hover:text-white hover:underline"
            >
              Read the risk disclosure
            </Link>
            .
          </p>
        </div>

        <div className={`relative mb-6 lg:mb-0 ${styles.rise}`} style={rise(200)}>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <p className="text-sm font-semibold tracking-tight text-white">Inside the cabinet</p>
              <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-200 ring-1 ring-inset ring-blue-400/30">
                USDT · BEP-20
              </span>
            </div>

            <ul className="divide-y divide-white/10">
              {PANEL_ROWS.map((row) => (
                <li key={row.label} className="flex items-start gap-3 py-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-blue-200">
                    <row.icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{row.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{row.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-400">
              Receiving addresses stay inside the app: they appear in the deposit dialog after you
              sign in, with a QR code for the transfer.
            </p>
          </div>

          <Link
            href="/fees"
            className="absolute -bottom-5 left-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-black/30 transition hover:bg-slate-100 sm:left-8"
          >
            Fees &amp; limits published
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
