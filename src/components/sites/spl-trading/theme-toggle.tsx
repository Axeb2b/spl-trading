"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

export type AuthTheme = "light" | "dark";

const STORAGE_KEY = "spl-trading-auth-theme";
const THEME_EVENT = "spl-trading-auth-theme";

function normalize(theme: string | null): AuthTheme {
  return theme === "dark" ? "dark" : "light";
}

/**
 * Dark mode has ONE mechanism: the `.dark` class on <html> (plus the matching
 * `color-scheme`).
 *
 * The previous build also set a separate `data-*` theme attribute, and the
 * captured stylesheet keyed off that attribute while the shadcn kit keyed off
 * `.dark` — the two implementations disagreed, so the header darkened while
 * the body stayed light. That attribute is gone for good.
 */
function applyTheme(theme: AuthTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme === "dark" ? "dark" : "light";
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

function getThemeSnapshot(): AuthTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
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
