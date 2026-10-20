"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, User, X } from "lucide-react";
import { ADMIN_NAV_ITEM, NAV_ITEMS } from "./nav-items";
import { ThemeToggle } from "../theme-toggle";
import { LiveIndicator } from "../live-indicator";
import { useRealtime } from "@/hooks/use-realtime";
import { formatIst } from "@/lib/time/ist";

type CabinetShellProps = {
  title: string;
  email: string;
  name: string;
  /** Staff accounts see the Admin entry in the navigation. */
  role?: "user" | "admin";
  children: ReactNode;
};

type ActivityRow = {
  id: string;
  type: string;
  description: string;
  direction: "debit" | "credit";
  amount_cents: number;
  currency: string;
  created_at: string;
};

type OnboardingState = {
  total: number;
  completed: number;
  percent: number;
  currentStepId: string | null;
};

const ACTIVITY_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  referral_reward: "Referral reward",
  fee: "Fee",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

export function CabinetShell({ title, email, name, role = "user", children }: CabinetShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [notesOpen, setNotesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);

  // Data is fetched by these helpers; the state is set by the caller, so no
  // setState happens synchronously inside an effect body.
  const loadActivity = useCallback(() => {
    return fetch("/api/v1/transactions?limit=5", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { entries?: ActivityRow[] } | null) => data?.entries ?? []);
  }, []);

  const loadOnboarding = useCallback(() => {
    return fetch("/api/v1/onboarding", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: OnboardingState | null) => data);
  }, []);

  const { state } = useRealtime({
    onEvent: (event) => {
      if (
        event.type === "transaction.created" ||
        event.type === "deposit.updated" ||
        event.type === "withdrawal.updated"
      ) {
        void loadActivity().then((rows) => setActivity(rows)).catch(() => undefined);
      }
      if (event.type === "onboarding.updated") {
        void loadOnboarding().then((data) => {
          if (data) setOnboarding(data);
        }).catch(() => undefined);
      }
    },
  });

  useEffect(() => {
    let cancelled = false;
    void loadActivity()
      .then((rows) => {
        if (!cancelled) setActivity(rows);
      })
      .catch(() => undefined);
    void loadOnboarding()
      .then((data) => {
        if (!cancelled && data) setOnboarding(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [loadActivity, loadOnboarding]);

  // Render-phase reset (not useEffect) — see known-issues.md: React 19's
  // react-hooks/set-state-in-effect rule bans synchronous setState in effects.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setNotesOpen(false);
    setMenuOpen(false);
    setDrawerOpen(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/sign-in");
    router.refresh();
  }

  const isNavActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isNavActive(href)
        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    }`;

  const panelClass =
    "absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900";

  const navItems = role === "admin" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const setupIncomplete = onboarding !== null && onboarding.completed < onboarding.total;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={drawerOpen}
              className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:block dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              {drawerOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>

            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                SP
              </span>
              <span className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {title}
              </span>
            </Link>

            <LiveIndicator state={state} />
          </div>

          <div className="flex items-center gap-1">
            <div className="mr-1 hidden max-w-[200px] text-right leading-tight sm:block">
              <div className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
                {name || email}
              </div>
              <div className="truncate text-[11px] text-slate-500">{email}</div>
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="Recent activity"
                aria-expanded={notesOpen}
                onClick={() => {
                  setNotesOpen((open) => !open);
                  setMenuOpen(false);
                  if (!notesOpen) {
                    void loadActivity()
                      .then((rows) => setActivity(rows))
                      .catch(() => undefined);
                  }
                }}
                className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <Bell className="size-5" aria-hidden />
                {activity.length > 0 ? (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
                ) : null}
              </button>
              {notesOpen ? (
                <div className={panelClass} role="dialog" aria-label="Recent activity">
                  <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    Recent activity
                  </p>
                  {activity.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-500">
                      No ledger activity yet. It appears here after your first deposit.
                    </p>
                  ) : (
                    activity.map((row) => (
                      <div key={row.id} className="border-b border-slate-100 px-4 py-2 last:border-b-0 dark:border-slate-800">
                        <p className="text-sm text-slate-700 dark:text-slate-200">
                          {ACTIVITY_LABELS[row.type] ?? row.type}
                          {row.description ? ` — ${row.description}` : ""}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatIst(row.created_at, "full")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => {
                  setMenuOpen((open) => !open);
                  setNotesOpen(false);
                }}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <User className="size-5" aria-hidden />
              </button>
              {menuOpen ? (
                <div className={panelClass} role="menu">
                  <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                      {name || email}
                    </p>
                    <p className="truncate text-xs text-slate-500">{email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {drawerOpen ? (
        <aside className="fixed left-0 top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-60 overflow-y-auto border-r border-slate-200 bg-white p-3 md:block dark:border-slate-800 dark:bg-slate-950">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.href)}
                aria-current={isNavActive(item.href) ? "page" : undefined}
              >
                <i className={`pi ${item.icon} text-sm`} aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
      ) : null}

      <div className={`min-h-[calc(100vh-3.5rem)] bg-slate-50 dark:bg-slate-950 ${drawerOpen ? "md:pl-60" : ""}`}>
        {setupIncomplete && onboarding ? (
          <div className="bg-gradient-to-r from-blue-600 to-blue-500">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20 sm:inline">
                  Setup step {onboarding.completed + 1} of {onboarding.total}
                </span>
                <div
                  className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-white/25"
                  role="progressbar"
                  aria-valuenow={onboarding.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Setup progress"
                >
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${Math.max(4, onboarding.percent)}%` }}
                  />
                </div>
              </div>
              <Link
                href="/onboarding"
                className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
              >
                Continue
              </Link>
            </div>
          </div>
        ) : null}

        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isNavActive(item.href) ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition ${
              isNavActive(item.href)
                ? "text-blue-600"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <i className={`pi ${item.icon} text-base`} aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
