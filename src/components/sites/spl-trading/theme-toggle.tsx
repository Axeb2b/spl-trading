"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

export type AuthTheme = "light" | "dark";

const STORAGE_KEY = "spl-trading-auth-theme";
const THEME_EVENT = "spl-trading-auth-theme";

function normalize(theme: string | null): AuthTheme {
  return theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: AuthTheme) {
  const root = document.documentElement;
  root.dataset.authTheme = theme;
  // The captured CSS keys off [data-auth-theme]; the shadcn UI kit keys off .dark.
  // Sync both so a single toggle themes the auth pages, the cabinet, and the new components.
  root.classList.toggle("dark", theme === "dark");
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

function getThemeSnapshot(): AuthTheme {
  return normalize(document.documentElement.dataset.authTheme ?? null);
}

function getThemeServerSnapshot(): AuthTheme {
  return "light";
}

/** Subscribe to the active theme so any component can react to toggles. */
export function useAuthTheme(): AuthTheme {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
}

export function ThemeApplier() {
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const theme = normalize(stored);
    applyTheme(theme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return null;
}

export function ThemeToggle({ className }: { className?: string } = {}) {
  const theme = useAuthTheme();

  function toggleTheme() {
    const next: AuthTheme = theme === "light" ? "dark" : "light";
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      type="button"
      className={
        className ??
        "grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
      }
      title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      onClick={toggleTheme}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
