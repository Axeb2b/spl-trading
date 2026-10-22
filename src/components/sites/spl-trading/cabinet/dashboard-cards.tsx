"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, TrendingUp, ArrowLeftRight, Lock } from "lucide-react";
import { DepositDialog } from "./deposit-dialog";
import { StatCard } from "@/components/ui/stat-card";
import { formatUsd } from "@/lib/format";
import { useCabinetRealtime } from "./realtime-context";

const MESSAGE_TONE: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

export type DashboardSummary = {
  availableCashCents: number;
  depositedPrincipalCents: number;
  pendingWithdrawalCents: number;
  hasCreditedDeposit: boolean;
  transactionCount: number;
};

type AccountStatus = {
  kind: "info" | "warn" | "success";
  text: string;
};

export function DashboardCards({ summary }: { summary: DashboardSummary }) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [status, setStatus] = useState<AccountStatus[]>([]);
  // Real state, not decoration: the lock clears once a deposit is credited.
  const locked = !summary.hasCreditedDeposit;

  const router = useRouter();
  const { subscribe } = useCabinetRealtime();
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [onboardingRes, depositsRes] = await Promise.all([
          fetch("/api/v1/onboarding", { cache: "no-store" }),
          fetch("/api/v1/deposits", { cache: "no-store" }),
        ]);
        if (!onboardingRes.ok || !depositsRes.ok) return;
        const onboarding = (await onboardingRes.json()) as {
          completed: number;
          total: number;
          percent: number;
        };
        const deposits = (await depositsRes.json()) as {
          destination?: { configured: boolean };
        };
        if (cancelled) return;

        const next: AccountStatus[] = [];
        if (onboarding.completed < onboarding.total) {
          next.push({
            kind: "info",
            text: `Setup is ${onboarding.percent}% complete — ${onboarding.completed} of ${onboarding.total} steps done.`,
          });
        } else {
          next.push({ kind: "success", text: "Setup is complete." });
        }
        if (deposits.destination?.configured === false) {
          next.push({
            kind: "warn",
            text: "Deposits are temporarily unavailable — no collection address is configured.",
          });
        }
        if (!summary.hasCreditedDeposit) {
          next.push({
            kind: "warn",
            text: "Deposit is required before payouts can be requested.",
          });
        }
        setStatus(next);
      } catch {
        /* keep whatever status we already have */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [summary.hasCreditedDeposit, reloadToken]);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type !== "onboarding.updated" && event.type !== "deposit.updated") return;
        setReloadToken((token) => token + 1);
        // The balance/stat numbers come from the server component.
        router.refresh();
      }),
    [router, subscribe],
  );

  const balance = (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-blue-500/20 blur-3xl"
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <Wallet className="size-4" aria-hidden />
            Available balance
          </span>
          {locked ? (
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-amber-200 ring-1 ring-inset ring-white/15">
              <Lock className="size-3" aria-hidden />
              Locked
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs text-emerald-200 ring-1 ring-inset ring-emerald-300/20">
              Active
            </span>
          )}
        </div>

        <p className="mt-4 text-4xl font-semibold tabular-nums tracking-tight">
          {locked ? formatUsd(0) : formatUsd(summary.availableCashCents)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Principal</p>
            <p className="mt-0.5 text-lg font-medium tabular-nums">
              {formatUsd(summary.depositedPrincipalCents)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Pending out</p>
            <p className="mt-0.5 text-lg font-medium tabular-nums">
              {formatUsd(summary.pendingWithdrawalCents)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const lockedCard = locked ? (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <span className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
        <Lock className="size-5" aria-hidden />
      </span>
      <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
        Deposit required
      </h2>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Make an initial USDT deposit to unlock trading and settle payouts.
      </p>
      <button
        type="button"
        onClick={() => setDepositOpen(true)}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        <ArrowLeftRight className="size-4" aria-hidden />
        Make deposit
      </button>
    </div>
  ) : null;

  return (
    <>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">{balance}</div>
        <div className="flex flex-col gap-4">
          {lockedCard ?? (
            <StatCard
              label="Transactions"
              value={String(summary.transactionCount)}
              sublabel="Deposits and withdrawals"
              icon={TrendingUp}
              tone="default"
            />
          )}
        </div>
      </div>

      {status.length > 0 ? (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Account status</h2>
          <ul className="mt-3 space-y-2">
            {status.map((note) => (
              <li
                key={note.text}
                className={`rounded-lg border px-3 py-2 text-sm ${MESSAGE_TONE[note.kind]}`}
              >
                {note.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {depositOpen ? <DepositDialog onClose={() => setDepositOpen(false)} /> : null}
    </>
  );
}
