import type { ReactNode } from "react";
import Link from "next/link";
import { AsideIcon, type AsideIconName } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export type AsideItem = {
  text: string;
  icon: AsideIconName;
};

const DEFAULT_ASIDE_ITEMS: AsideItem[] = [
  { text: "Crypto and bank settlements", icon: "check" },
  { text: "Commission on every payout you cover", icon: "check" },
  { text: "Support in your own Telegram group", icon: "check" },
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
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — decorative, hidden on small screens where the form is the priority. */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-1/4 size-96 rounded-full bg-blue-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-white text-xs font-bold text-slate-900">
            SP
          </span>
          <span className="text-sm font-semibold tracking-tight">SPL Trading</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">{asideTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{asideText}</p>

          <ul className="mt-8 space-y-3">
            {items.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-emerald-300 ring-1 ring-inset ring-white/15">
                  <AsideIcon name={item.icon} />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          Demo environment — no real funds are moved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-slate-50 px-5 py-8 sm:px-10 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
                <span className="grid size-7 place-items-center rounded-lg bg-slate-900 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
                  SP
                </span>
                <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  SPL Trading
                </span>
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {title}
              </h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {headLinkText ? (
                <p className="hidden text-sm text-slate-500 sm:block">
                  {headLinkText}{" "}
                  <Link
                    href={headLinkTo ?? "/"}
                    className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-50"
                  >
                    {headLinkCta}
                  </Link>
                </p>
              ) : null}
              <ThemeToggle />
            </div>
          </div>

          {step ? (
            <AuthStepProgress step={step} labels={stepLabels ?? ["Your details", "Telegram"]} />
          ) : null}

          <div className="flex-1">{children}</div>

          {footText && !hideFoot ? (
            <p
              className={`mt-8 text-center text-sm text-slate-500 ${
                footMobileOnly ? "sm:hidden" : ""
              }`}
            >
              {footText}{" "}
              <Link
                href={footLinkTo ?? "/"}
                className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-50"
              >
                {footCta}
              </Link>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function AuthStepProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="mb-6 flex gap-2" aria-label="Progress">
      {labels.map((label, index) => {
        const done = step > index + 1;
        const active = step >= index + 1;
        return (
          <li key={label} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                active ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
            <p
              className={`mt-2 text-xs font-medium ${
                active ? "text-slate-900 dark:text-slate-100" : "text-slate-400"
              }`}
            >
              {done ? "✓ " : null}
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
