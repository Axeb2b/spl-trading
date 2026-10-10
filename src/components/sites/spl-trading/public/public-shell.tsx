import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

/** Chrome shared by every public route: skip link, header, main, footer. */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
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

const CONTAINER = "mx-auto w-full max-w-6xl px-4";

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
    <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className={`${CONTAINER} py-14 sm:py-16`}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-slate-900 sm:text-4xl dark:text-slate-50">
          {title}
        </h1>
        <div className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
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
      <div className={`${CONTAINER} py-12 sm:py-14`}>
        <div className="max-w-2xl">
          {index ? (
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              {index}
            </p>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-3xl dark:text-slate-50">
            {title}
          </h2>
          {lede ? (
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{lede}</p>
          ) : null}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

/** Hairline card used for feature, step and disclosure grids. */
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
        <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900">
          {icon}
        </span>
      ) : null}
      <h3
        className={cn(
          "text-base font-semibold text-slate-900 dark:text-slate-50",
          icon && "mt-4",
        )}
      >
        {title}
      </h3>
      <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {children}
      </div>
    </>
  );

  const base = cn(
    "block h-full rounded-xl border border-slate-200 bg-white p-5 transition dark:border-slate-800 dark:bg-slate-900",
    href &&
      "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700",
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
