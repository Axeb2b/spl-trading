"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, LifeBuoy, LogOut, UserRound, X } from "lucide-react";
import { BrandLockup } from "../brand";
import { ThemeToggle } from "../theme-toggle";
import { NAV_ITEMS } from "./nav-items";

type CabinetShellProps = {
  title: string;
  email: string;
  name: string;
  children: ReactNode;
};

export function CabinetShell({ title, email, name, children }: CabinetShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setNotificationsOpen(false);
    setAccountOpen(false);
  }

  const isNavActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/auth/sign-in");
      router.refresh();
    }
  }

  const userLabel = name.trim() || email;
  const userInitial = (name.trim()[0] || email[0] || "S").toUpperCase();

  function renderNavLink(item: (typeof NAV_ITEMS)[number], mobile = false) {
    const active = isNavActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={
          mobile
            ? `flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition ${active ? "text-emerald-800 dark:text-lime-300" : "text-slate-500 dark:text-slate-400"}`
            : `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}`
        }
      >
        <Icon className={mobile ? "size-[18px]" : `size-[18px] shrink-0 ${active ? "" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} aria-hidden />
        <span className={mobile ? "max-w-full truncate" : "min-w-0 truncate"}>{mobile ? item.mobileLabel : item.label}</span>
        {!mobile && active ? <span className="ml-auto size-1.5 rounded-full bg-emerald-700 dark:bg-lime-300" aria-hidden /> : null}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-slate-900 dark:bg-[#0a1210] dark:text-slate-100">
      <a
        href="#main"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-slate-950 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-slate-200/80 bg-white px-4 py-5 dark:border-slate-800 dark:bg-[#101a17] lg:flex">
        <BrandLockup className="px-2" />

        <div className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Account workspace
        </div>
        <nav aria-label="Account navigation" className="mt-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => renderNavLink(item))}
        </nav>

        <div className="mt-auto">
          <Link
            href="/support"
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#f7f9f7] p-3.5 transition hover:border-emerald-300 hover:bg-emerald-50/70 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-800 shadow-sm dark:bg-slate-800 dark:text-emerald-300">
              <LifeBuoy className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-900 dark:text-white">Need a hand?</span>
              <span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">See support options</span>
            </span>
          </Link>

          <div className="mt-4 flex items-center gap-3 border-t border-slate-200 px-2 pt-4 dark:border-slate-800">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              {userInitial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{userLabel}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/90 dark:bg-[#101a17]/90">
          <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLockup compact className="lg:hidden" />
              <span className="hidden h-7 w-px bg-slate-200 sm:block lg:hidden dark:bg-slate-700" aria-hidden />
              <span className="hidden truncate text-sm font-semibold text-slate-700 sm:block lg:hidden dark:text-slate-200">
                {title}
              </span>
              <div className="hidden lg:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">SPL Trading</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Account workspace</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="mr-1 hidden max-w-[190px] text-right leading-tight md:block lg:hidden">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{userLabel}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{email}</p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  aria-controls="notifications-panel"
                  onClick={() => {
                    setNotificationsOpen((open) => !open);
                    setAccountOpen(false);
                  }}
                  className="relative grid size-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <Bell className="size-[18px]" aria-hidden />
                </button>
                {notificationsOpen ? (
                  <div id="notifications-panel" className="absolute right-0 top-full z-50 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900" role="region" aria-label="Notifications">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                      <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-center dark:bg-slate-800/70">
                      <span className="mx-auto grid size-9 place-items-center rounded-full bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300">
                        <Check className="size-4" aria-hidden />
                      </span>
                      <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">You&apos;re all caught up</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Important account updates will appear here.</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <ThemeToggle />

              <div className="relative">
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  aria-controls="account-panel"
                  onClick={() => {
                    setAccountOpen((open) => !open);
                    setNotificationsOpen(false);
                  }}
                  className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <UserRound className="size-[18px]" aria-hidden />
                </button>
                {accountOpen ? (
                  <div id="account-panel" className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900" role="region" aria-label="Account menu">
                    <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{userInitial}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{userLabel}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex min-h-11 w-full items-center gap-2.5 px-4 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <LogOut className="size-4 text-slate-400" aria-hidden />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-7xl px-5 pb-28 pt-7 sm:px-8 sm:pt-9 lg:pb-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Account workspace</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-[1.8rem] dark:text-white">{title}</h1>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span aria-hidden className="size-1.5 rounded-full bg-emerald-600 dark:bg-lime-300" />
              Amounts in USD
            </div>
          </div>
          {children}
        </main>
      </div>

      <nav aria-label="Mobile account navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-slate-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden dark:border-slate-800 dark:bg-[#101a17]/95">
        {NAV_ITEMS.map((item) => renderNavLink(item, true))}
      </nav>
    </div>
  );
}
