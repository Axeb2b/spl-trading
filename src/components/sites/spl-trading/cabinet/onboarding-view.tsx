"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, HelpCircle, Percent } from "lucide-react";
import { useCabinetRealtime } from "./realtime-context";

type StepStatus = "complete" | "current" | "available";

type OnboardingStep = {
  id: string;
  index: number;
  title: string;
  body: string;
  status: StepStatus;
  optional: boolean;
  actionLabel: string | null;
  actionHref: string | null;
};

type OnboardingState = {
  total: number;
  completed: number;
  percent: number;
  currentStepId: string | null;
  steps: OnboardingStep[];
};

/**
 * The setup checklist.
 *
 * Progress comes from `GET /api/v1/onboarding`, which derives each step from
 * a verifiable fact. The previous build hardcoded "1 of 12" and a progress
 * percentage, so the banner and the page could disagree with reality.
 */
export function OnboardingView() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    fetch("/api/v1/onboarding", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load failed"))))
      .then((body: OnboardingState) => {
        if (cancelled) return;
        setState(body);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setError("We could not load your setup progress. Reload the page to try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  const { subscribe } = useCabinetRealtime();
  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === "onboarding.updated") void load();
      }),
    [load, subscribe],
  );

  if (error) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        {error}
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading setup progress…</span>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    );
  }

  const complete = state.completed === state.total;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ol className="flex-1 space-y-3">
        {state.steps.map((step) => {
          const done = step.status === "complete";
          return (
            <li
              key={step.id}
              data-step-status={step.status}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  done
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {done ? <CheckCircle2 className="size-4" aria-hidden /> : step.index}
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {step.title}
                  {step.optional ? (
                    <span className="ml-2 text-xs font-normal text-slate-400">optional</span>
                  ) : null}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{step.body}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {done ? "Complete" : step.status === "current" ? "Next step" : "To do"}
                </p>
                {step.actionLabel && step.actionHref && !done ? (
                  <Link
                    href={step.actionHref}
                    className="mt-3 inline-flex h-9 items-center rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {step.actionLabel}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <aside className="w-full space-y-4 lg:w-72">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <HelpCircle className="size-4 text-slate-400" aria-hidden />
            Need help?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Stuck on a step? Support is available 24/7 in Telegram and via email.
          </p>
          <Link
            href="/support"
            className="mt-4 flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Contact support
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <Percent className="size-4 text-slate-400" aria-hidden />
            Progress
          </h2>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
            {state.percent}%
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <CircleDashed className="size-3.5" aria-hidden />
            {complete
              ? "Setup complete"
              : `${state.completed} of ${state.total} steps complete`}
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="progressbar"
            aria-valuenow={state.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
          >
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${state.percent}%` }} />
          </div>
          {complete ? (
            <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              You&apos;re all set.
            </p>
          ) : null}
        </div>

        <p className="text-xs text-slate-400">Timestamps and daily boundaries use Asia/Kolkata (IST).</p>
      </aside>
    </div>
  );
}
