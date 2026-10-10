"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { AUTH_LINKS, NAV_LINKS, isNavLinkActive } from "./public-links";
import styles from "./public.module.css";

export function PublicHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Render-phase reset (React 19 rejects setState inside useEffect for this).
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const desktopLinkClass = (href: string) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      isNavLinkActive(pathname, href)
        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-slate-900 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">
              SP
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              SPL Trading
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
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

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <Link
            href={AUTH_LINKS.signIn.href}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            {AUTH_LINKS.signIn.label}
          </Link>
          <Link
            href={AUTH_LINKS.signUp.href}
            className="hidden h-9 items-center rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white transition hover:bg-slate-700 sm:inline-flex dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {AUTH_LINKS.signUp.label}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="public-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="public-menu"
          className={`border-t border-slate-200 bg-white px-4 pb-4 pt-2 lg:hidden dark:border-slate-800 dark:bg-slate-950 ${styles.pop}`}
        >
          <nav aria-label="Menu" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isNavLinkActive(pathname, link.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isNavLinkActive(pathname, link.href)
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 sm:hidden dark:border-slate-800">
            <Link
              href={AUTH_LINKS.signUp.href}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
            >
              {AUTH_LINKS.signUp.label}
            </Link>
            <Link
              href={AUTH_LINKS.signIn.href}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {AUTH_LINKS.signIn.label}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
