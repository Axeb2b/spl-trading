import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

const CONTAINER = "mx-auto w-full max-w-7xl px-5 sm:px-8";

/** Chrome shared by every public route: skip link, header, main, footer. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9f7] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-slate-950 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <PublicHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

/** Masthead used by every interior public page. */
export function PublicPageIntro({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-emerald-950/5 bg-[#f0f5f0] dark:border-slate-800 dark:bg-slate-900/65">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-44 size-[32rem] rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/15" />
      <div className={cn("relative py-14 sm:py-18 lg:py-20", CONTAINER)}>
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:border-emerald-400/15 dark:bg-slate-900/75 dark:text-emerald-300">
          <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[3.5rem] dark:text-white">
          {title}
        </h1>
        <div className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
          {lede}
        </div>
      </div>
    </section>
  );
}

/** Numbered/labelled content band inside a public page. */
export function PublicSection({
  index,
  title,
  lede,
  children,
  className,
}: {
  index?: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className={cn("py-14 sm:py-16 lg:py-20", CONTAINER)}>
        <div className="max-w-3xl">
          {index ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
              {index}
            </p>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl dark:text-slate-50">
            {title}
          </h2>
          {lede ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600 dark:text-slate-400">
              {lede}
            </p>
          ) : null}
        </div>
        <div className="mt-8 sm:mt-10">{children}</div>
      </div>
    </section>
  );
}

/** Reusable card used for feature, step and disclosure grids. */
export function PublicCard({
  title,
  children,
  href,
  icon,
  className,
}: {
  title: string;
  children: ReactNode;
  href?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      {icon ? (
        <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-900/5 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-400/10">
          {icon}
        </span>
      ) : null}
      <div className={cn("flex items-start justify-between gap-4", icon && "mt-5")}>
        <h3 className="text-base font-semibold tracking-[-0.015em] text-slate-950 dark:text-slate-50">
          {title}
        </h3>
        {href ? <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-300" aria-hidden /> : null}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {children}
      </div>
    </>
  );

  const base = cn(
    "block h-full rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(15,35,25,0.025)] transition duration-200 dark:border-slate-800 dark:bg-slate-900",
    href &&
      "group hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_12px_28px_rgba(19,72,49,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/35 dark:hover:border-emerald-800",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {body}
      </Link>
    );
  }

  return <div className={base}>{body}</div>;
}
