"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { BrandLockup } from "../brand";
import { AUTH_LINKS, NAV_LINKS, isNavLinkActive } from "./public-links";
import styles from "./public.module.css";

export function PublicHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close the compact navigation after client-side route changes.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const desktopLinkClass = (href: string) =>
    `relative rounded-full px-3.5 py-2 text-[13px] font-medium transition ${
      isNavLinkActive(pathname, href)
        ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    }`;

  const mobileLinkClass = (href: string) =>
    `flex min-h-11 items-center rounded-xl px-3.5 text-sm font-medium transition ${
      isNavLinkActive(pathname, href)
        ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/90">
      <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <BrandLockup compact />

          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isNavLinkActive(pathname, link.href) ? "page" : undefined}
                className={desktopLinkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link
            href={AUTH_LINKS.signIn.href}
            className="hidden min-h-10 items-center rounded-full px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 sm:inline-flex dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {AUTH_LINKS.signIn.label}
          </Link>
          <Link
            href={AUTH_LINKS.signUp.href}
            className="hidden min-h-10 items-center justify-center rounded-full bg-emerald-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/35 sm:inline-flex dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200"
          >
            {AUTH_LINKS.signUp.label}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="public-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="grid size-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="public-menu"
          className={`border-t border-slate-200 bg-white px-5 pb-5 pt-3 sm:px-8 lg:hidden dark:border-slate-800 dark:bg-slate-950 ${styles.pop}`}
        >
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isNavLinkActive(pathname, link.href) ? "page" : undefined}
                className={mobileLinkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 border-t border-slate-200 pt-4 sm:hidden dark:border-slate-800">
              <Link
                href={AUTH_LINKS.signUp.href}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200"
              >
                {AUTH_LINKS.signUp.label}
              </Link>
              <Link
                href={AUTH_LINKS.signIn.href}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {AUTH_LINKS.signIn.label}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
