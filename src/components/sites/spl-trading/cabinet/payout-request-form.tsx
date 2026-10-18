"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpFromLine, CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/ui/money-input";
import { formatUsd } from "@/lib/format";

type PayoutRequestFormProps = {
  balanceCents: number;
  minCents: number;
  feeBps: number;
};

type CreatedWithdrawal = {
  internalRef: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  status: string;
};

const BEP20_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function PayoutRequestForm({ balanceCents, minCents, feeBps }: PayoutRequestFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedWithdrawal | null>(null);

  const parsedAmount = Number.parseFloat(amount);
  const amountCents = Number.isFinite(parsedAmount) ? Math.round(parsedAmount * 100) : 0;
  const feeCents = amountCents > 0 ? Math.ceil((amountCents * feeBps) / 10_000) : 0;
  const netCents = Math.max(0, amountCents - feeCents);
  const amountValid = amountCents >= minCents && amountCents <= balanceCents && netCents > 0;
  const addressValid = BEP20_ADDRESS_RE.test(address.trim());

  async function submitRequest() {
    if (!amountValid || !addressValid || !confirmed || submitting) {
      setError("Check the amount, destination, and network confirmation before continuing.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          destinationType: "BEP20",
          destinationRef: address.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string; withdrawal?: CreatedWithdrawal };
      if (!response.ok) {
        setError(data.error ?? "Could not create your payout request.");
        return;
      }
      if (!data.withdrawal) {
        setError("The response was incomplete. Check payout history before trying again.");
        return;
      }
      setCreated(data.withdrawal);
      setAmount("");
      toast.success("Payout request recorded", {
        description: "Your available balance is held while an operator reviews the request.",
      });
      router.refresh();
    } catch {
      setError("Connection problem. Check payout history before retrying.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-800">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-200">
          <ArrowUpFromLine className="size-[18px]" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Request a USDT payout</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
            BNB Smart Chain (BEP-20) only. Requests are manually reviewed and are not sent automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
        <div className="space-y-4">
          <MoneyInput
            id="payout-amount"
            label="Amount requested"
            value={amount}
            onChange={(value) => { setAmount(value); setError(null); setCreated(null); }}
            currency="USD"
            minCents={minCents}
            maxCents={balanceCents}
            hint={`Available balance: ${formatUsd(balanceCents)}. Minimum payout: ${formatUsd(minCents)}.`}
            error={error && !amountValid ? error : undefined}
          />
          <div>
            <label htmlFor="payout-address" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              USDT receiving address
            </label>
            <input
              id="payout-address"
              type="text"
              value={address}
              onChange={(event) => { setAddress(event.target.value); setError(null); setCreated(null); }}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="0x…"
              aria-describedby="payout-address-hint"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-sm text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400"
            />
            <p id="payout-address-hint" className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Enter a 42-character 0x address on BNB Smart Chain. Only BEP-20 USDT is supported.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-5 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => { setConfirmed(event.target.checked); setError(null); }}
              className="mt-0.5 size-4 shrink-0 accent-emerald-800"
            />
            <span>I checked this destination in my wallet, and it supports USDT on BNB Smart Chain (BEP-20).</span>
          </label>
          {error ? <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">{error}</p> : null}
          <button
            type="button"
            disabled={!amountValid || !addressValid || !confirmed || submitting}
            onClick={submitRequest}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffda3d] px-4 text-sm font-bold text-[#17191f] transition hover:bg-[#ffe46a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ArrowUpFromLine className="size-4" aria-hidden />}
            {submitting ? "Submitting request…" : "Submit payout request"}
          </button>
          {created ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm dark:border-emerald-900 dark:bg-emerald-950/35">
              <p className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-100"><ShieldCheck className="size-4" aria-hidden /> Request recorded</p>
              <p className="mt-1 text-xs leading-5 text-emerald-900/80 dark:text-emerald-200/80">
                {created.internalRef} · requested {formatUsd(created.amountCents)} · fee {formatUsd(created.feeCents)} · net {formatUsd(created.netCents)}. Status: pending review.
              </p>
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-[#30343c] bg-[#191c22] p-4 text-white sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Before you submit</p>
          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3"><dt className="text-slate-300">Requested</dt><dd className="font-mono font-semibold tabular-nums">{formatUsd(amountCents)}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-slate-300">Platform fee ({(feeBps / 100).toFixed(2)}%)</dt><dd className="font-mono tabular-nums">−{formatUsd(feeCents)}</dd></div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3"><dt className="font-semibold text-white">Net account amount</dt><dd className="font-mono text-base font-semibold tabular-nums text-[#ffda3d]">{formatUsd(netCents)}</dd></div>
          </dl>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-3 text-[11px] leading-5 text-amber-50/90">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-[#ffda3d]" aria-hidden />
            <p>Submitting holds the requested amount from your available balance. Amounts are recorded in USD cents; an operator must confirm the USDT equivalent and any network cost, then manually settle an approved payout.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
