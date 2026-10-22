"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { BadgeCheck, Clock, Gift, RefreshCw, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { StatusPill, depositStatus, withdrawalStatus } from "@/components/ui/status-pill";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDate, formatUsd } from "@/lib/format";
import { LiveIndicator } from "../live-indicator";
import { useCabinetRealtime } from "./realtime-context";
import { DataTable } from "./view-primitives";

type Overview = {
  users: number;
  depositsCreditedTotalCents: number;
  depositsCreditedCount: number;
  depositsPendingCount: number;
  withdrawalsPendingCount: number;
  referralRewardsPendingCount: number;
  referralRewardsPendingCents: number;
};

type DepositOrder = {
  id: string;
  user_id: string;
  internal_ref: string;
  amount_cents: number;
  status: string;
  provider_ref: string | null;
  reject_reason: string | null;
  created_at: string;
};

type WithdrawalRequest = {
  id: string;
  user_id: string;
  internal_ref: string;
  amount_cents: number;
  fee_cents: number;
  net_cents: number;
  status: string;
  destination_type: string;
  destination_ref: string;
  created_at: string;
};

type Config = {
  bep20Address: string;
  depositMinCents: number;
  depositMaxCents: number;
  withdrawalFeeBps: number;
  flags: Record<FlagKey, boolean>;
  liveModeEnv: boolean;
};

type FlagKey = "deposits" | "withdrawals" | "referrals" | "investments";

type Draft = {
  bep20Address: string;
  depositMin: string;
  depositMax: string;
  feeBps: string;
  flags: Record<FlagKey, boolean>;
};

type Tab = "overview" | "deposits" | "withdrawals" | "config";
type DepositBucket = "review" | "all" | "credited" | "rejected" | "expired";
type WithdrawalBucket = "open" | "all" | "completed" | "rejected" | "failed";
type ActionKind = "deposit" | "withdrawal";
type ActionName = "verify" | "reject" | "approve" | "start_processing" | "complete";

type PendingAction = {
  kind: ActionKind;
  action: ActionName;
  id: string;
  ref: string;
};

type TableColumn = {
  key: string;
  header: string;
  align?: "left" | "right";
};

const REVIEW_STATUSES = new Set(["pending", "awaiting_payment", "confirming"]);
const OPEN_STATUSES = new Set(["pending", "approved", "processing"]);

const DEPOSIT_FILTERS = [
  { value: "review", label: "Needs review" },
  { value: "all", label: "All orders" },
  { value: "credited", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const WITHDRAWAL_FILTERS = [
  { value: "open", label: "In flight" },
  { value: "all", label: "All requests" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "failed", label: "Failed" },
];

const FLAG_ROWS: { key: FlagKey; label: string; hint: string }[] = [
  { key: "deposits", label: "Accept new deposit orders", hint: "New deposits are credited after verification." },
  { key: "withdrawals", label: "Accept and process payouts", hint: "Disabling blocks approve, process and complete." },
  { key: "referrals", label: "Accrue referral rewards", hint: "Existing rewards stay pending while off." },
  { key: "investments", label: "Enable investment products", hint: "Shows investment plans in the cabinet." },
];

const ACTION_TITLE: Record<ActionName, string> = {
  verify: "Verify",
  reject: "Reject",
  approve: "Approve",
  start_processing: "Start processing",
  complete: "Complete",
};

const ACTION_CONFIRM: Record<ActionName, string> = {
  verify: "Verify deposit",
  reject: "Reject",
  approve: "Approve",
  start_processing: "Start processing",
  complete: "Complete payout",
};

const ACTION_DESCRIPTION: Record<ActionName, string> = {
  verify: "This credits the customer's balance immediately and cannot be undone.",
  reject: "The customer will see the reason you provide.",
  approve: "The payout is approved and can be sent to the destination.",
  start_processing: "Mark the payout as being sent. The customer sees this state.",
  complete: "Record the on-chain transaction hash to close the request.",
};

const DEPOSIT_COLUMNS: TableColumn[] = [
  { key: "reference", header: "Reference" },
  { key: "amount", header: "Amount", align: "right" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created" },
  { key: "actions", header: "Actions", align: "right" },
];

const WITHDRAWAL_COLUMNS: TableColumn[] = [
  { key: "reference", header: "Reference" },
  { key: "destination", header: "Destination" },
  { key: "amount", header: "Amount", align: "right" },
  { key: "status", header: "Status" },
  { key: "created", header: "Created" },
  { key: "actions", header: "Actions", align: "right" },
];

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-xs outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "text-xs font-medium text-slate-500 dark:text-slate-400";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

function centsOf(value: string): number {
  return Math.round(Number(value) * 100);
}

function draftFromConfig(config: Config): Draft {
  return {
    bep20Address: config.bep20Address,
    depositMin: (config.depositMinCents / 100).toFixed(2),
    depositMax: (config.depositMaxCents / 100).toFixed(2),
    feeBps: String(config.withdrawalFeeBps),
    flags: { ...config.flags },
  };
}

function sameDraft(a: Draft, b: Draft): boolean {
  return (
    a.bep20Address.trim().toLowerCase() === b.bep20Address.trim().toLowerCase() &&
    centsOf(a.depositMin) === centsOf(b.depositMin) &&
    centsOf(a.depositMax) === centsOf(b.depositMax) &&
    Number(a.feeBps) === Number(b.feeBps) &&
    a.flags.deposits === b.flags.deposits &&
    a.flags.withdrawals === b.flags.withdrawals &&
    a.flags.referrals === b.flags.referrals &&
    a.flags.investments === b.flags.investments
  );
}

function validateDraft(draft: Draft): string | null {
  const min = Number(draft.depositMin);
  const max = Number(draft.depositMax);
  const fee = Number(draft.feeBps);
  const blank =
    draft.depositMin.trim() === "" || draft.depositMax.trim() === "" || draft.feeBps.trim() === "";
  if (blank || !Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(fee)) {
    return "Enter numeric limits and fees.";
  }
  if (min < 0 || max < 0 || fee < 0) return "Limits cannot be negative.";
  if (min > max) return "The minimum cannot exceed the maximum.";
  if (!Number.isInteger(fee) || fee > 10_000) {
    return "The withdrawal fee must be a whole number between 0 and 10000 basis points (0–100%).";
  }
  if (draft.bep20Address.trim() && !/^0x[a-fA-F0-9]{40}$/.test(draft.bep20Address.trim())) {
    return "Enter a valid BEP-20 address (0x followed by 40 hex characters).";
  }
  return null;
}

function successMessage(pending: PendingAction): string {
  switch (pending.action) {
    case "verify":
      return "Deposit verified and credited.";
    case "reject":
      return pending.kind === "deposit" ? "Deposit rejected." : "Withdrawal rejected.";
    case "approve":
      return "Withdrawal approved.";
    case "start_processing":
      return "Payout marked as processing.";
    case "complete":
      return "Payout completed.";
  }
}

function ErrorBanner({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
        className,
      )}
    >
      <span>{message}</span>
      {onRetry ? (
        <Button type="button" variant="outline" size="xs" onClick={onRetry}>
          <RefreshCw aria-hidden />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal text-slate-900 shadow-xs outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminConsole() {
  const { state, subscribe } = useCabinetRealtime();

  const [tab, setTab] = useState<Tab>("overview");
  const [queueToken, setQueueToken] = useState(0);
  const [configToken, setConfigToken] = useState(0);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [deposits, setDeposits] = useState<DepositOrder[] | null>(null);
  const [depositsError, setDepositsError] = useState<string | null>(null);
  const [depositBucket, setDepositBucket] = useState<DepositBucket>("review");

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[] | null>(null);
  const [withdrawalsError, setWithdrawalsError] = useState<string | null>(null);
  const [withdrawalBucket, setWithdrawalBucket] = useState<WithdrawalBucket>("open");

  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const [pending, setPending] = useState<PendingAction | null>(null);
  const [providerRef, setProviderRef] = useState("");
  const [reason, setReason] = useState("");
  const [txHash, setTxHash] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (tab !== "overview") return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getJson<Overview>("/api/v1/admin/overview");
        if (cancelled) return;
        setOverview(data);
        setOverviewError(null);
      } catch (error) {
        if (!cancelled) setOverviewError(messageOf(error));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, queueToken]);

  useEffect(() => {
    if (tab !== "deposits") return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getJson<{ deposits: DepositOrder[] }>("/api/v1/admin/deposits");
        if (cancelled) return;
        setDeposits(data.deposits ?? []);
        setDepositsError(null);
      } catch (error) {
        if (!cancelled) setDepositsError(messageOf(error));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, queueToken]);

  useEffect(() => {
    if (tab !== "withdrawals") return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getJson<{ withdrawals: WithdrawalRequest[] }>(
          "/api/v1/admin/withdrawals",
        );
        if (cancelled) return;
        setWithdrawals(data.withdrawals ?? []);
        setWithdrawalsError(null);
      } catch (error) {
        if (!cancelled) setWithdrawalsError(messageOf(error));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, queueToken]);

  useEffect(() => {
    if (tab !== "config") return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getJson<Config>("/api/v1/admin/config");
        if (cancelled) return;
        setConfig(data);
        setDraft((current) => current ?? draftFromConfig(data));
        setConfigError(null);
      } catch (error) {
        if (!cancelled) setConfigError(messageOf(error));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, configToken]);

  useEffect(() => {
    return subscribe((event) => {
      if (event.type !== "admin.queue.updated") return;
      setQueueToken((value) => value + 1);
      setConfigToken((value) => value + 1);
    });
  }, [subscribe]);

  useEffect(() => {
    if (state !== "polling" && state !== "offline") return;
    const timer = window.setInterval(() => {
      setQueueToken((value) => value + 1);
      setConfigToken((value) => value + 1);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [state]);

  const pendingDeposits = useMemo(
    () => (deposits ?? []).filter((order) => REVIEW_STATUSES.has(order.status)).length,
    [deposits],
  );

  const visibleDeposits = useMemo(() => {
    const all = deposits ?? [];
    switch (depositBucket) {
      case "all":
        return all;
      case "credited":
        return all.filter((order) => order.status === "credited");
      case "rejected":
        return all.filter((order) => order.status === "rejected");
      case "expired":
        return all.filter((order) => order.status === "expired");
      default:
        return all.filter((order) => REVIEW_STATUSES.has(order.status));
    }
  }, [deposits, depositBucket]);

  const openWithdrawals = useMemo(
    () => (withdrawals ?? []).filter((request) => OPEN_STATUSES.has(request.status)).length,
    [withdrawals],
  );

  const visibleWithdrawals = useMemo(() => {
    const all = withdrawals ?? [];
    switch (withdrawalBucket) {
      case "all":
        return all;
      case "completed":
        return all.filter((request) => request.status === "completed");
      case "rejected":
        return all.filter((request) => request.status === "rejected");
      case "failed":
        return all.filter((request) => request.status === "failed");
      default:
        return all.filter((request) => OPEN_STATUSES.has(request.status));
    }
  }, [withdrawals, withdrawalBucket]);

  const openAction = useCallback((next: PendingAction) => {
    setPending(next);
    setProviderRef("");
    setReason("");
    setTxHash("");
    setActionError(null);
  }, []);

  const closeAction = useCallback(() => {
    if (!actionBusy) setPending(null);
  }, [actionBusy]);

  const depositRows = useMemo<Record<string, ReactNode>[]>(() => {
    return visibleDeposits.map((order) => ({
      reference: (
        <div>
          <p className="font-mono text-xs text-slate-900 dark:text-slate-100">{order.internal_ref}</p>
          <p className="text-xs text-slate-400">{shortId(order.user_id)}</p>
        </div>
      ),
      amount: (
        <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
          {formatUsd(order.amount_cents)}
        </span>
      ),
      status: <StatusPill {...depositStatus(order.status)} />,
      created: <span className="text-slate-500 dark:text-slate-400">{formatDate(order.created_at)}</span>,
      actions: (
        <div className="flex justify-end gap-1.5">
          {REVIEW_STATUSES.has(order.status) ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() =>
                  openAction({
                    kind: "deposit",
                    action: "verify",
                    id: order.id,
                    ref: order.internal_ref,
                  })
                }
              >
                Verify
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={() =>
                  openAction({
                    kind: "deposit",
                    action: "reject",
                    id: order.id,
                    ref: order.internal_ref,
                  })
                }
              >
                Reject
              </Button>
            </>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    }));
  }, [visibleDeposits, openAction]);

  const withdrawalRows = useMemo<Record<string, ReactNode>[]>(() => {
    return visibleWithdrawals.map((request) => ({
      reference: (
        <div>
          <p className="font-mono text-xs text-slate-900 dark:text-slate-100">
            {request.internal_ref}
          </p>
          <p className="text-xs text-slate-400">{shortId(request.user_id)}</p>
        </div>
      ),
      destination: (
        <div className="text-xs">
          <span className="text-slate-700 dark:text-slate-300">{request.destination_type}</span>
          <span className="text-slate-400"> · {shortId(request.destination_ref)}</span>
        </div>
      ),
      amount: (
        <div>
          <p className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
            {formatUsd(request.net_cents)}
          </p>
          <p className="text-xs text-slate-400">{formatUsd(request.fee_cents)} fee</p>
        </div>
      ),
      status: <StatusPill {...withdrawalStatus(request.status)} />,
      created: (
        <span className="text-slate-500 dark:text-slate-400">{formatDate(request.created_at)}</span>
      ),
      actions: (
        <div className="flex justify-end gap-1.5">
          {request.status === "pending" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() =>
                  openAction({
                    kind: "withdrawal",
                    action: "approve",
                    id: request.id,
                    ref: request.internal_ref,
                  })
                }
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={() =>
                  openAction({
                    kind: "withdrawal",
                    action: "reject",
                    id: request.id,
                    ref: request.internal_ref,
                  })
                }
              >
                Reject
              </Button>
            </>
          ) : null}
          {request.status === "approved" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() =>
                  openAction({
                    kind: "withdrawal",
                    action: "start_processing",
                    id: request.id,
                    ref: request.internal_ref,
                  })
                }
              >
                Start processing
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={() =>
                  openAction({
                    kind: "withdrawal",
                    action: "reject",
                    id: request.id,
                    ref: request.internal_ref,
                  })
                }
              >
                Reject
              </Button>
            </>
          ) : null}
          {request.status === "processing" ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() =>
                  openAction({
                    kind: "withdrawal",
                    action: "complete",
                    id: request.id,
                    ref: request.internal_ref,
                  })
                }
              >
                Complete
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={() =>
                  openAction({
                    kind: "withdrawal",
                    action: "reject",
                    id: request.id,
                    ref: request.internal_ref,
                  })
                }
              >
                Reject
              </Button>
            </>
          ) : null}
          {OPEN_STATUSES.has(request.status) ? null : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    }));
  }, [visibleWithdrawals, openAction]);

  const dirty = Boolean(draft && config && !sameDraft(draft, draftFromConfig(config)));

  const updateDraft = (patch: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const updateFlag = (key: FlagKey, value: boolean) => {
    setDraft((current) =>
      current ? { ...current, flags: { ...current.flags, [key]: value } } : current,
    );
  };

  const submitAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pending) return;
    if (pending.action === "complete" && !txHash.trim()) {
      setActionError("Enter the transaction hash before completing the payout.");
      return;
    }
    if (pending.action === "reject" && !reason.trim()) {
      setActionError("Enter a reason for the rejection.");
      return;
    }
    setActionError(null);
    setActionBusy(true);
    try {
      const body: Record<string, unknown> = { action: pending.action };
      if (pending.kind === "deposit") body.depositId = pending.id;
      else body.withdrawalId = pending.id;
      if (pending.action === "verify" && providerRef.trim()) body.providerRef = providerRef.trim();
      if (pending.action === "reject") body.reason = reason.trim();
      if (pending.action === "complete") body.txHash = txHash.trim();

      const response = await fetch(
        pending.kind === "deposit" ? "/api/v1/admin/deposits" : "/api/v1/admin/withdrawals",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setActionError(data.error ?? "Action failed.");
        return;
      }
      toast.success(successMessage(pending));
      setPending(null);
      setQueueToken((value) => value + 1);
    } catch {
      setActionError("Connection problem. Try again.");
    } finally {
      setActionBusy(false);
    }
  };

  const saveConfig = async () => {
    if (!draft || !config) return;
    const message = validateDraft(draft);
    if (message) {
      setFormError(message);
      return;
    }
    const initial = draftFromConfig(config);
    const updates: { key: string; value: string | boolean }[] = [];
    if (draft.bep20Address.trim() !== initial.bep20Address.trim()) {
      updates.push({ key: "bep20_deposit_address", value: draft.bep20Address.trim() });
    }
    if (centsOf(draft.depositMin) !== centsOf(initial.depositMin)) {
      updates.push({ key: "deposit_min_cents", value: String(centsOf(draft.depositMin)) });
    }
    if (centsOf(draft.depositMax) !== centsOf(initial.depositMax)) {
      updates.push({ key: "deposit_max_cents", value: String(centsOf(draft.depositMax)) });
    }
    if (Number(draft.feeBps) !== Number(initial.feeBps)) {
      updates.push({ key: "withdrawal_fee_bps", value: String(Number(draft.feeBps)) });
    }
    for (const flag of FLAG_ROWS) {
      if (draft.flags[flag.key] !== initial.flags[flag.key]) {
        updates.push({ key: `${flag.key}_enabled`, value: draft.flags[flag.key] });
      }
    }
    if (updates.length === 0) return;

    setFormError(null);
    setSavingConfig(true);
    try {
      let saved = 0;
      for (const update of updates) {
        const response = await fetch("/api/v1/admin/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        });
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          const failure = data.error ?? "Could not save settings.";
          setFormError(failure);
          toast.error(failure);
          return;
        }
        saved += 1;
      }
      toast.success(saved === 1 ? "Setting saved." : `${saved} settings saved.`);
      setConfigToken((value) => value + 1);
    } catch {
      const failure = "Connection problem. Try again.";
      setFormError(failure);
      toast.error(failure);
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Admin console
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Operational control for deposits, payouts and platform limits.
          </p>
        </div>
        <LiveIndicator state={state} />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-4">
        <TabsList className="w-full overflow-x-auto sm:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {tab === "overview" ? (
          <section aria-label="Platform overview" className="grid gap-4">
            {overviewError ? (
              <ErrorBanner
                message={overviewError}
                onRetry={() => setQueueToken((value) => value + 1)}
              />
            ) : null}
            {overview === null ? (
              <StatCardGrid columns={3}>
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-28 w-full" />
                ))}
              </StatCardGrid>
            ) : (
              <StatCardGrid columns={3}>
                <StatCard
                  label="Users"
                  value={String(overview.users)}
                  sublabel="Registered accounts"
                  icon={Users}
                />
                <StatCard
                  label="Deposits verified"
                  value={formatUsd(overview.depositsCreditedTotalCents)}
                  sublabel={`${overview.depositsCreditedCount} credited ${
                    overview.depositsCreditedCount === 1 ? "order" : "orders"
                  }`}
                  icon={BadgeCheck}
                  tone="positive"
                />
                <StatCard
                  label="Deposits to review"
                  value={String(overview.depositsPendingCount)}
                  sublabel="Awaiting verification"
                  icon={Clock}
                  tone={overview.depositsPendingCount > 0 ? "default" : "muted"}
                />
                <StatCard
                  label="Withdrawals to review"
                  value={String(overview.withdrawalsPendingCount)}
                  sublabel="Pending, approved or processing"
                  icon={Wallet}
                  tone={overview.withdrawalsPendingCount > 0 ? "default" : "muted"}
                />
                <StatCard
                  label="Referral rewards pending"
                  value={formatUsd(overview.referralRewardsPendingCents)}
                  sublabel={`${overview.referralRewardsPendingCount} pending`}
                  icon={Gift}
                  tone={overview.referralRewardsPendingCount > 0 ? "default" : "muted"}
                />
              </StatCardGrid>
            )}
          </section>
        ) : null}

        {tab === "deposits" ? (
          <section aria-label="Deposit review">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Deposit orders
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {visibleDeposits.length} of {deposits?.length ?? 0} orders · {pendingDeposits} need
                  review · Recent 200 orders only.
                </p>
              </div>
              <div className="flex items-end gap-2">
                <FilterSelect
                  label="Show"
                  value={depositBucket}
                  onChange={(value) => setDepositBucket(value as DepositBucket)}
                  options={DEPOSIT_FILTERS}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Refresh deposits"
                  onClick={() => setQueueToken((value) => value + 1)}
                >
                  <RefreshCw aria-hidden />
                </Button>
              </div>
            </div>
            {depositsError ? (
              <ErrorBanner
                className="mb-4"
                message={depositsError}
                onRetry={() => setQueueToken((value) => value + 1)}
              />
            ) : null}
            {deposits === null ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <DataTable
                columns={DEPOSIT_COLUMNS}
                rows={depositRows}
                emptyText={
                  depositBucket === "review"
                    ? "No deposits need review."
                    : "No deposits match this filter."
                }
              />
            )}
          </section>
        ) : null}

        {tab === "withdrawals" ? (
          <section aria-label="Withdrawal review">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Withdrawal requests
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {visibleWithdrawals.length} of {withdrawals?.length ?? 0} requests ·{" "}
                  {openWithdrawals} in flight · Recent 200 requests only.
                </p>
              </div>
              <div className="flex items-end gap-2">
                <FilterSelect
                  label="Show"
                  value={withdrawalBucket}
                  onChange={(value) => setWithdrawalBucket(value as WithdrawalBucket)}
                  options={WITHDRAWAL_FILTERS}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Refresh withdrawals"
                  onClick={() => setQueueToken((value) => value + 1)}
                >
                  <RefreshCw aria-hidden />
                </Button>
              </div>
            </div>
            {withdrawalsError ? (
              <ErrorBanner
                className="mb-4"
                message={withdrawalsError}
                onRetry={() => setQueueToken((value) => value + 1)}
              />
            ) : null}
            {withdrawals === null ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <DataTable
                columns={WITHDRAWAL_COLUMNS}
                rows={withdrawalRows}
                emptyText={
                  withdrawalBucket === "open"
                    ? "No withdrawals are in flight."
                    : "No withdrawals match this filter."
                }
              />
            )}
          </section>
        ) : null}

        {tab === "config" ? (
          <section aria-label="Platform configuration" className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Limits &amp; feature flags
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Changes apply to new orders only. Live mode is set at deploy time.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Refresh configuration"
                onClick={() => setConfigToken((value) => value + 1)}
              >
                <RefreshCw aria-hidden />
              </Button>
            </div>
            {configError ? (
              <ErrorBanner
                message={configError}
                onRetry={() => setConfigToken((value) => value + 1)}
              />
            ) : null}
            {config === null || draft === null ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 sm:col-span-2">
                    <span className={labelClass}>BEP-20 deposit address</span>
                    <input
                      value={draft.bep20Address}
                      onChange={(event) => updateDraft({ bep20Address: event.target.value })}
                      className={cn(inputClass, "font-mono")}
                      placeholder="0x…"
                      spellCheck={false}
                    />
                    <span className="text-xs text-slate-400">
                      Leave empty to hide the deposit address from customers.
                    </span>
                  </label>
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Minimum deposit (USD)</span>
                    <input
                      value={draft.depositMin}
                      onChange={(event) => updateDraft({ depositMin: event.target.value })}
                      className={inputClass}
                      inputMode="decimal"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Maximum deposit (USD)</span>
                    <input
                      value={draft.depositMax}
                      onChange={(event) => updateDraft({ depositMax: event.target.value })}
                      className={inputClass}
                      inputMode="decimal"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Withdrawal fee (basis points)</span>
                    <input
                      value={draft.feeBps}
                      onChange={(event) => updateDraft({ feeBps: event.target.value })}
                      className={inputClass}
                      inputMode="numeric"
                    />
                    <span className="text-xs text-slate-400">100 bps = 1%.</span>
                  </label>
                </div>

                <div className="grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  {FLAG_ROWS.map((flag) => (
                    <div key={flag.key} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {flag.label}
                        </p>
                        <p className="text-xs text-slate-400">{flag.hint}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.flags[flag.key]}
                        aria-label={flag.label}
                        onClick={() => updateFlag(flag.key, !draft.flags[flag.key])}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                          draft.flags[flag.key]
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-slate-700",
                        )}
                      >
                        <span
                          className={cn(
                            "size-4 rounded-full bg-white shadow-sm transition-transform",
                            draft.flags[flag.key] ? "translate-x-[18px]" : "translate-x-0.5",
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-medium",
                      config.liveModeEnv
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                    )}
                  >
                    {config.liveModeEnv ? "Live mode on" : "Live mode off"}
                  </span>
                  <span>
                    Set at deploy time (<code className="font-mono">SPL_LIVE_MODE</code>). Feature
                    flags only take effect while live mode is on.
                  </span>
                </div>

                {formError ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                    {formError}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!dirty || savingConfig}
                    onClick={() => {
                      setDraft(draftFromConfig(config));
                      setFormError(null);
                    }}
                  >
                    Discard
                  </Button>
                  <Button type="button" onClick={saveConfig} disabled={!dirty || savingConfig}>
                    {savingConfig ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </Tabs>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !actionBusy) setPending(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {pending ? (
            <form onSubmit={submitAction} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>
                  {ACTION_TITLE[pending.action]} {pending.ref}
                </DialogTitle>
                <DialogDescription>{ACTION_DESCRIPTION[pending.action]}</DialogDescription>
              </DialogHeader>

              {pending.action === "verify" ? (
                <label className="grid gap-1.5">
                  <span className={labelClass}>
                    On-chain reference{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </span>
                  <input
                    value={providerRef}
                    onChange={(event) => setProviderRef(event.target.value)}
                    className={inputClass}
                    placeholder="Transaction hash or provider reference"
                    autoFocus
                  />
                </label>
              ) : null}

              {pending.action === "reject" ? (
                <label className="grid gap-1.5">
                  <span className={labelClass}>Reason</span>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className={cn(inputClass, "h-auto py-2")}
                    rows={3}
                    placeholder="Shown to the customer"
                  />
                </label>
              ) : null}

              {pending.action === "complete" ? (
                <label className="grid gap-1.5">
                  <span className={labelClass}>Transaction hash</span>
                  <input
                    value={txHash}
                    onChange={(event) => setTxHash(event.target.value)}
                    className={cn(inputClass, "font-mono")}
                    placeholder="0x…"
                    spellCheck={false}
                  />
                </label>
              ) : null}

              {actionError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  {actionError}
                </p>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAction} disabled={actionBusy}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={pending.action === "reject" ? "destructive" : "default"}
                  disabled={actionBusy}
                >
                  {actionBusy ? "Working…" : ACTION_CONFIRM[pending.action]}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
