"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Power, Save, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AdminConfig = {
  bep20Address: string;
  depositMinCents: number;
  depositMaxCents: number;
  withdrawalFeeBps: number;
  flags: {
    deposits: boolean;
    withdrawals: boolean;
    referrals: boolean;
    investments: boolean;
  };
  liveModeEnv: boolean;
};

const FLAG_LABELS: { key: keyof AdminConfig["flags"]; label: string; hint: string }[] = [
  { key: "deposits", label: "Deposits", hint: "Allow customers to create deposit orders." },
  { key: "withdrawals", label: "Payouts", hint: "Allow customers to request withdrawals." },
  { key: "referrals", label: "Referrals", hint: "Record and pay referral rewards." },
  { key: "investments", label: "Investment products", hint: "Investment feature surface." },
];

function usdToCents(value: string): number {
  return Math.round(Number(value) * 100);
}

export function AdminConfig() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState({ min: "", max: "", fee: "", address: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/admin/config");
    if (!res.ok) {
      toast.error("Could not load configuration");
      return;
    }
    const json: AdminConfig = await res.json();
    setConfig(json);
    setDraft({
      min: String(json.depositMinCents / 100),
      max: String(json.depositMaxCents / 100),
      fee: String(json.withdrawalFeeBps),
      address: json.bep20Address,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(key: string, value: unknown, label: string) {
    setBusy(key);
    try {
      const res = await fetch("/api/v1/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? `Could not update ${label}`);
        return;
      }
      toast.success(`${label} updated`);
      await load();
    } catch {
      toast.error(`Could not update ${label}`);
    } finally {
      setBusy(null);
    }
  }

  if (!config) return <p className="text-sm text-slate-500">Loading configuration…</p>;

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center gap-2">
          <Power className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Feature flags</h2>
        </header>
        <p className="mt-1 text-xs text-slate-500">
          Money movement stays off unless live mode is enabled in the environment
          {config.liveModeEnv ? " (live mode is ON)" : " (live mode is OFF — flags are forced off)"}.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {FLAG_LABELS.map((flag) => {
            const enabled = config.flags[flag.key];
            return (
              <div
                key={flag.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{flag.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{flag.hint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`Toggle ${flag.label}`}
                  disabled={busy === `${flag.key}_enabled`}
                  onClick={() => void patch(`${flag.key}_enabled`, !enabled, flag.label)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
                    enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-5 transform rounded-full bg-white shadow transition",
                      enabled ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Limits &amp; fees</h2>
        </header>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Minimum deposit (USD)"
            value={draft.min}
            onChange={(v) => setDraft((d) => ({ ...d, min: v }))}
            busy={busy === "deposit_min_cents"}
            onSave={() => void patch("deposit_min_cents", usdToCents(draft.min), "Minimum deposit")}
          />
          <NumberField
            label="Maximum deposit (USD)"
            value={draft.max}
            onChange={(v) => setDraft((d) => ({ ...d, max: v }))}
            busy={busy === "deposit_max_cents"}
            onSave={() => void patch("deposit_max_cents", usdToCents(draft.max), "Maximum deposit")}
          />
          <NumberField
            label="Withdrawal fee (bps)"
            value={draft.fee}
            onChange={(v) => setDraft((d) => ({ ...d, fee: v }))}
            busy={busy === "withdrawal_fee_bps"}
            onSave={() => void patch("withdrawal_fee_bps", Number(draft.fee), "Withdrawal fee")}
            hint="100 bps = 1.00%"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center gap-2">
          <Wallet className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">BEP-20 receiving address</h2>
        </header>
        <p className="mt-1 text-xs text-slate-500">
          Shown to customers inside the deposit dialog once they sign in. Never rendered on public pages.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={draft.address}
            onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            placeholder="0x…"
            spellCheck={false}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <Button
            type="button"
            onClick={() => void patch("bep20_deposit_address", draft.address, "Receiving address")}
            disabled={busy === "bep20_deposit_address"}
          >
            {busy === "bep20_deposit_address" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            Save address
          </Button>
        </div>
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  onSave,
  busy,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  busy: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <div className="mt-1.5 flex gap-2">
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm tabular-nums text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <Button type="button" variant="outline" size="icon" onClick={onSave} disabled={busy} aria-label={`Save ${label}`}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
        </Button>
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
