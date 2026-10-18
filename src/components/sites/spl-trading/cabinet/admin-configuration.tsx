"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Check, CircleCheck, CircleX, LoaderCircle, Save, ShieldCheck } from "lucide-react";

export type AdminConfig = {
  bep20Address: string;
  depositQrDataUrl: string | null;
  depositAddressValid: boolean;
  depositMinCents: number;
  depositMaxCents: number;
  withdrawalFeeBps: number;
  flags: { deposits: boolean; withdrawals: boolean; referrals: boolean; investments: boolean };
  configuredFlags: { deposits: boolean; withdrawals: boolean; referrals: boolean; investments: boolean };
  featureUnlockMinCents: number;
  liveModeEnv: boolean;
};

function asDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

async function patchConfig(key: string, value: unknown): Promise<void> {
  const response = await fetch("/api/v1/admin/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Could not save configuration.");
}

function GateCheck({ ready, children }: { ready: boolean; children: ReactNode }) {
  const Icon = ready ? CircleCheck : CircleX;
  return (
    <li className="flex items-start gap-2.5 text-xs leading-5">
      <Icon className={`mt-0.5 size-4 shrink-0 ${ready ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`} aria-hidden />
      <span className={ready ? "text-slate-700 dark:text-slate-200" : "text-slate-600 dark:text-slate-400"}>{children}</span>
    </li>
  );
}

export function AdminConfiguration() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [address, setAddress] = useState("");
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [feePercent, setFeePercent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyFlag, setBusyFlag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadConfig = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/v1/admin/config", { cache: "no-store" });
      const data = (await response.json()) as AdminConfig & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load platform configuration.");
      setConfig(data);
      setAddress(data.bep20Address);
      setMinimum(asDollars(data.depositMinCents));
      setMaximum(asDollars(data.depositMaxCents));
      setFeePercent((data.withdrawalFeeBps / 100).toFixed(2));
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load platform configuration.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/config", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as AdminConfig & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Could not load platform configuration.");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setConfig(data);
        setAddress(data.bep20Address);
        setMinimum(asDollars(data.depositMinCents));
        setMaximum(asDollars(data.depositMaxCents));
        setFeePercent((data.withdrawalFeeBps / 100).toFixed(2));
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load platform configuration.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const addressValid = /^0x[a-fA-F0-9]{40}$/.test(address.trim());
  const minCents = Math.round(Number.parseFloat(minimum) * 100);
  const maxCents = Math.round(Number.parseFloat(maximum) * 100);
  const feeBps = Math.round(Number.parseFloat(feePercent) * 100);
  const limitsValid = Number.isInteger(minCents) && Number.isInteger(maxCents) && minCents >= 50_000 && maxCents >= minCents;
  const feeValid = Number.isInteger(feeBps) && feeBps >= 0 && feeBps < 10_000;

  const readyChecks = useMemo(() => {
    if (!config) return [];
    return [
      { ready: config.depositAddressValid, label: "Valid BEP-20 receiving address saved on the server" },
      { ready: config.depositMinCents >= 50_000 && config.depositMaxCents >= config.depositMinCents, label: "Minimum at least $500; maximum is not below the minimum" },
      { ready: config.configuredFlags.deposits, label: "Deposit feature flag is staged on" },
      { ready: config.liveModeEnv, label: "SPL_LIVE_MODE=1 is set for this server" },
    ];
  }, [config]);
  const depositReady = readyChecks.length > 0 && readyChecks.every((item) => item.ready);

  async function saveSettings() {
    if (!addressValid || !limitsValid || !feeValid || saving) {
      setError("Check the address, limits, and fee values before saving.");
      setMessage(null);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await patchConfig("bep20_deposit_address", address.trim());
      await patchConfig("deposit_limits", { minCents, maxCents });
      await patchConfig("withdrawal_fee_bps", feeBps);
      if (!(await loadConfig())) throw new Error("Settings were saved, but the server could not refresh them. Reload this panel before changing more values.");
      setMessage("Configuration saved. The server still requires every live-mode gate before accepting orders.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save platform configuration.");
    } finally {
      setSaving(false);
    }
  }

  async function setFlag(key: "deposits_enabled" | "withdrawals_enabled", enabled: boolean) {
    setBusyFlag(key);
    setError(null);
    setMessage(null);
    try {
      await patchConfig(key, enabled);
      if (await loadConfig()) {
        setMessage(config?.liveModeEnv
          ? "Feature flag updated. Confirm all live prerequisites before accepting customer funds."
          : "Feature flag staged. It remains ineffective until SPL_LIVE_MODE=1 is set on the server.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update feature flag.");
    } finally {
      setBusyFlag(null);
    }
  }

  if (loading) {
    return <div className="flex min-h-32 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"><LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading server gates…</div>;
  }

  if (!config) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
        <p className="font-semibold">Configuration unavailable</p>
        <p className="mt-1 text-xs leading-5">{error ?? "Check that this account has administrator access."}</p>
        <button type="button" onClick={() => { setError(null); setLoading(true); void loadConfig(); }} className="mt-3 min-h-9 rounded-lg border border-red-300 px-3 text-xs font-semibold dark:border-red-800">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className={`rounded-2xl border p-4 sm:p-5 ${depositReady ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/25" : "border-amber-200 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/25"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={`grid size-9 place-items-center rounded-xl ${depositReady ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100" : "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"}`}>
              {depositReady ? <ShieldCheck className="size-[18px]" aria-hidden /> : <AlertTriangle className="size-[18px]" aria-hidden />}
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Deposit preflight: {depositReady ? "ready" : "not ready"}</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-700 dark:text-slate-300">All four checks must pass. The API enforces the live-mode and address gates before an order is created.</p>
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${depositReady ? "bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100" : "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100"}`}>
            {depositReady ? "All gates met" : "Orders remain off"}
          </span>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {readyChecks.map((item) => <GateCheck key={item.label} ready={item.ready}>{item.label}</GateCheck>)}
        </ul>
        {!config.liveModeEnv ? (
          <p className="mt-4 rounded-xl border border-amber-300/80 bg-white/70 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-black/10 dark:text-amber-100">
            Live mode is an environment-level safety switch. Set <code className="font-mono font-semibold">SPL_LIVE_MODE=1</code> only after wallet ownership, on-chain monitoring/manual review, payout operations, and compliance requirements are signed off; restart the server afterward.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Wallet and commercial settings</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">The QR is generated from this receiving address at runtime; no cropped screenshot is used as the payment source.</p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">USDT receiving address · BNB Smart Chain (BEP-20)</span>
            <input value={address} onChange={(event) => setAddress(event.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            <span className="mt-1.5 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">Decoded from the supplied QR and matched to the address shown in the image. Save changes to refresh the server-generated QR.</span>
          </label>
          <div className="sm:col-span-2 flex flex-col items-center gap-4 rounded-2xl border border-[#30343c] bg-[#191c22] p-4 text-center text-white sm:flex-row sm:text-left">
            {config.depositQrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.depositQrDataUrl} alt="Operator preview of the generated USDT BEP-20 deposit QR" width={144} height={144} className="size-36 rounded-xl bg-white p-2" />
            ) : <div className="grid size-36 shrink-0 place-items-center rounded-xl border border-dashed border-white/20 px-3 text-xs text-slate-400">QR unavailable until address is valid</div>}
            <div>
              <p className="text-sm font-semibold">Operator-only QR preview</p>
              <p className="mt-1 max-w-lg text-xs leading-5 text-slate-300">Customer deposit details stay hidden until live mode, the deposit switch, and all server checks pass. Do not send funds to a preview order.</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">USDT · BNB Smart Chain (BEP-20)</p>
            </div>
          </div>
          <label>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Minimum deposit (USD)</span>
            <input type="number" min="500" step="0.01" value={minimum} onChange={(event) => setMinimum(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-sm tabular-nums text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            <span className="mt-1.5 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">Server-enforced floor: $500.00. A verified $500 credited deposit unlocks payout requests.</span>
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Maximum deposit (USD)</span>
            <input type="number" min="500" step="0.01" value={maximum} onChange={(event) => setMaximum(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-sm tabular-nums text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payout fee (%)</span>
            <input type="number" min="0" max="99.99" step="0.01" value={feePercent} onChange={(event) => setFeePercent(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-sm tabular-nums text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
            <span className="mt-1.5 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">Current default: 1.00%. Changes apply to new payout requests only.</span>
          </label>
          <div className="sm:col-span-2">
            <button type="button" onClick={() => void saveSettings()} disabled={saving || !addressValid || !limitsValid || !feeValid} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ffda3d] px-4 text-xs font-bold text-[#17191f] transition hover:bg-[#ffe46a] disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
              {saving ? "Saving settings…" : "Save configuration"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Money-movement switches</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">Feature switches are staged in configuration. Effective status also requires live mode.</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {([
            ["deposits_enabled", "Deposit orders", config.configuredFlags.deposits, config.flags.deposits],
            ["withdrawals_enabled", "Payout requests", config.configuredFlags.withdrawals, config.flags.withdrawals],
          ] as const).map(([key, label, configured, active]) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{active ? "Active for this deployment" : config.liveModeEnv && configured ? "Staged on; checking remaining gates" : "Off"}</p>
              </div>
              <button type="button" role="switch" aria-checked={configured} aria-label={`${label} configured switch`} disabled={busyFlag === key} onClick={() => void setFlag(key, !configured)} className={`relative inline-flex h-7 w-12 items-center rounded-full p-1 transition ${configured ? "bg-emerald-700" : "bg-slate-300 dark:bg-slate-700"} disabled:opacity-60`}>
                <span className={`size-5 rounded-full bg-white shadow-sm transition-transform ${configured ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Investment features</p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">Not implemented in this build; no switch is exposed and no investment returns or P&amp;L are shown.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Unavailable</span>
          </div>
        </div>
      </section>

      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">{error}</p> : null}
      {message ? <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"><Check className="mt-0.5 size-4 shrink-0" aria-hidden />{message}</p> : null}
    </div>
  );
}
