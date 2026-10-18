import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, BookOpenCheck, Check } from "lucide-react";
import { BrandLockup } from "./brand";
import { ThemeToggle } from "./theme-toggle";

export type AsideItem = {
  text: string;
};

const DEFAULT_ASIDE_ITEMS: AsideItem[] = [
  { text: "Review transfer details before you confirm" },
  { text: "Follow references and order statuses" },
  { text: "No investment return is promised" },
];

type AuthShellProps = {
  title: string;
  subtitle?: string;
  asideTitle: string;
  asideText: string;
  asideItems?: AsideItem[];
  step?: number;
  stepLabels?: string[];
  headLinkText?: string;
  headLinkCta?: string;
  headLinkTo?: string;
  footText?: string;
  footCta?: string;
  footLinkTo?: string;
  footMobileOnly?: boolean;
  hideFoot?: boolean;
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  asideTitle,
  asideText,
  asideItems,
  step,
  stepLabels,
  headLinkText,
  headLinkCta,
  headLinkTo,
  footText,
  footCta,
  footLinkTo,
  footMobileOnly,
  hideFoot,
  children,
}: AuthShellProps) {
  const items = asideItems?.length ? asideItems : DEFAULT_ASIDE_ITEMS;

  return (
    <div className="grid min-h-screen bg-[#f4f7f4] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] dark:bg-slate-950">
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#0a211b] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div aria-hidden className="pointer-events-none absolute -left-36 -top-28 size-[34rem] rounded-full bg-emerald-600/20 blur-[100px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-36 size-[34rem] rounded-full bg-lime-300/10 blur-[100px]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(190,243,170,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(190,243,170,0.045)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative z-10">
          <BrandLockup inverse />
        </div>

        <div className="relative z-10 max-w-lg py-14">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-200/80">
            <span aria-hidden className="h-px w-7 bg-lime-200/70" />
            Your account, clearly organized
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.045em] xl:text-5xl">
            {asideTitle}
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-emerald-50/65">{asideText}</p>

          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-lime-200/10 text-lime-100">
                <ArrowDownToLine className="size-[18px]" aria-hidden />
              </span>
              <p className="mt-4 text-sm font-semibold text-white">Deposits in context</p>
              <p className="mt-1 text-xs leading-5 text-white/50">Network, amount, and order status.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-lime-200/10 text-lime-100">
                <ArrowUpFromLine className="size-[18px]" aria-hidden />
              </span>
              <p className="mt-4 text-sm font-semibold text-white">Activity you can trace</p>
              <p className="mt-1 text-xs leading-5 text-white/50">Payouts and ledger records.</p>
            </div>
          </div>

          <ul className="mt-8 space-y-3">
            {items.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-sm leading-6 text-emerald-50/75">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lime-200/10 text-lime-100">
                  <Check className="size-3" strokeWidth={2.5} aria-hidden />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-5 border-t border-white/10 pt-5 text-xs text-white/65">
          <span>© {new Date().getFullYear()} SPL Trading</span>
          <span className="inline-flex items-center gap-2"><BookOpenCheck className="size-3.5" aria-hidden /> Account records, not projections</span>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-10 xl:px-14">
        <div className="mx-auto flex w-full max-w-[500px] flex-1 flex-col">
          <div className="mb-10 flex items-center justify-between gap-4">
            <BrandLockup compact className="lg:hidden" />
            <div className="hidden flex-1 sm:flex sm:justify-end">
              {headLinkText ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {headLinkText}{" "}
                  <Link
                    href={headLinkTo ?? "/"}
                    className="font-semibold text-emerald-800 underline-offset-4 transition hover:underline dark:text-emerald-300"
                  >
                    {headLinkCta}
                  </Link>
                </p>
              ) : null}
            </div>
            <ThemeToggle />
          </div>

          <header className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
              SPL Trading account
            </p>
            <h1 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl dark:text-white">
              {title}
            </h1>
            {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{subtitle}</p> : null}
          </header>

          {step ? <AuthStepProgress step={step} labels={stepLabels ?? ["Your details", "Telegram"]} /> : null}

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(14,46,33,0.055)] sm:p-7 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            {children}
          </div>

          {footText && !hideFoot ? (
            <p className={`mt-7 text-center text-sm text-slate-500 dark:text-slate-400 ${footMobileOnly ? "sm:hidden" : ""}`}>
              {footText}{" "}
              <Link
                href={footLinkTo ?? "/"}
                className="font-semibold text-emerald-800 underline-offset-4 transition hover:underline dark:text-emerald-300"
              >
                {footCta}
              </Link>
            </p>
          ) : null}

          <div className="mt-auto pt-10 text-center text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            By continuing, you agree to use the service in accordance with its{" "}
            <Link href="/terms" className="font-semibold underline underline-offset-2">terms</Link>{" "}
            and <Link href="/risk" className="font-semibold underline underline-offset-2">risk disclosure</Link>.
          </div>
        </div>
      </main>
    </div>
  );
}

function AuthStepProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="mb-6 flex gap-3" aria-label="Progress">
      {labels.map((label, index) => {
        const done = step > index + 1;
        const active = step >= index + 1;
        return (
          <li key={label} className="flex-1" aria-current={active && !done ? "step" : undefined}>
            <div
              className={`h-1.5 rounded-full transition-colors ${
                active ? "bg-emerald-700 dark:bg-lime-300" : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
            <p className={`mt-2 text-xs font-medium ${active ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}`}>
              {done ? "✓ " : null}{label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
