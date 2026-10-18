"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Countdown } from "./countdown";
import { cn } from "@/lib/utils";

export type QrPanelData = {
  address: string;
  network: string;
  asset: string;
  qrDataUrl: string | null;
  configured: boolean;
};

type QrPanelProps = {
  destination: QrPanelData;
  amountCents?: number;
  internalRef?: string;
  expiresAt?: string | null;
  className?: string;
};

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function QrPanel({ destination, amountCents, internalRef, expiresAt, className }: QrPanelProps) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const amount = amountCents === undefined ? null : formatAmount(amountCents);

  async function saveOrShareAddress() {
    if (!destination.address || sharing) return;
    setSharing(true);
    const details = [
      `USDT deposit address · ${destination.network} (BEP-20)`,
      amount ? `Send exactly ${amount} USDT.` : "",
      `Address: ${destination.address}`,
      internalRef ? `Order reference: ${internalRef}` : "",
      expiresAt ? `Order expires: ${new Date(expiresAt).toLocaleString()}` : "",
    ].filter(Boolean).join("\n");

    try {
      if (navigator.share) {
        if (destination.qrDataUrl && typeof File !== "undefined") {
          const blob = await (await fetch(destination.qrDataUrl)).blob();
          const file = new File([blob], `spl-usdt-bep20-${destination.address.slice(2, 8)}.png`, { type: blob.type || "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title: "USDT deposit address", text: details, files: [file] });
          } else {
            await navigator.share({ title: "USDT deposit address", text: details });
          }
        } else {
          await navigator.share({ title: "USDT deposit address", text: details });
        }
        return;
      }

      if (destination.qrDataUrl) {
        const anchor = document.createElement("a");
        anchor.href = destination.qrDataUrl;
        anchor.download = `spl-usdt-bep20-${destination.address.slice(2, 8)}.png`;
        anchor.click();
      }
      await navigator.clipboard.writeText(details);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
      toast.success("QR saved and deposit details copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share these details. Use the copy-address button instead.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <section className={cn("overflow-hidden rounded-[1.5rem] border border-[#30343c] bg-[#20242b] text-white", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Network</p>
          <p className="mt-1.5 text-sm font-semibold text-white"><span className="text-amber-300">BSC</span><span className="ml-2 font-normal text-slate-300">BNB Smart Chain (BEP-20)</span></p>
          <p className="mt-1 text-xs text-slate-400">USDT · contract ending <span className="font-mono text-slate-300">…97955</span></p>
        </div>
        <span className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-100">Network locked</span>
      </div>

      {amount ? (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Send exactly</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">{amount} <span className="text-sm text-slate-300">USDT</span></p>
          </div>
          <span className="rounded-lg bg-amber-300/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-200">Unlocks at $500 verified</span>
        </div>
      ) : null}

      <div className="p-4 sm:p-5">
        <div className="mx-auto grid aspect-square w-full max-w-[250px] place-items-center rounded-[1.4rem] bg-white p-3 sm:max-w-[272px]">
          {destination.qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={destination.qrDataUrl}
              alt={`QR code for the ${destination.network} ${destination.asset} deposit address`}
              className="size-full rounded-lg object-contain"
              width={280}
              height={280}
            />
          ) : (
            <div className="flex size-full items-center justify-center rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs leading-5 text-slate-600">
              {destination.configured ? "QR could not be generated. Use the address below." : "Receiving address is not available. Do not send funds."}
            </div>
          )}
        </div>

        {destination.address ? (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-400">Deposit address</p>
                <p className="mt-1 text-[10px] text-slate-500">BEP-20 · USDT</p>
              </div>
              <CopyButton value={destination.address} label="Copy deposit address" />
            </div>
            <code className="mt-2 block break-all rounded-xl bg-[#171a20] px-3.5 py-3 font-mono text-sm font-semibold leading-6 tracking-[-0.02em] text-white selection:bg-amber-300 selection:text-[#17191f]">
              {destination.address}
            </code>
          </div>
        ) : null}

        {(internalRef || expiresAt || amount) ? (
          <details className="group mt-4 border-t border-white/[0.08] pt-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white [&::-webkit-details-marker]:hidden">
              More details <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <dl className="grid gap-2 border-t border-white/[0.06] pb-1 pt-3 text-xs sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-400">Asset</dt><dd className="font-medium text-slate-200">Tether USD (USDT)</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-slate-400">Network</dt><dd className="font-medium text-slate-200">BNB Smart Chain</dd></div>
              {amount ? <div className="flex items-center justify-between gap-3"><dt className="text-slate-400">Order amount</dt><dd className="font-mono font-semibold tabular-nums text-white">{amount} USDT</dd></div> : null}
              {internalRef ? <div className="flex items-center justify-between gap-3"><dt className="text-slate-400">Reference</dt><dd className="flex min-w-0 items-center gap-1.5"><code className="truncate font-mono font-medium text-slate-200">{internalRef}</code><CopyButton value={internalRef} label="Copy reference" className="border-white/10 bg-[#2a2e37] text-slate-200 hover:bg-[#343a45]" /></dd></div> : null}
              {expiresAt ? <div className="flex items-center justify-between gap-3"><dt className="text-slate-400">Expires in</dt><dd className="font-mono font-medium text-slate-200"><Countdown expiresAt={expiresAt} /></dd></div> : null}
            </dl>
          </details>
        ) : null}

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-3.5 text-xs leading-5 text-amber-50/90">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
          <p>Send only USDT on BNB Smart Chain (BEP-20). A transfer on another network, or for a different amount, may not be recoverable or automatically matched.</p>
        </div>

        <button type="button" onClick={() => void saveOrShareAddress()} disabled={sharing || !destination.address} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffda3d] px-4 text-sm font-bold text-[#17191f] transition hover:bg-[#ffe46a] disabled:cursor-not-allowed disabled:opacity-50">
          {sharing ? <span className="size-4 animate-spin rounded-full border-2 border-[#17191f]/30 border-t-[#17191f]" aria-hidden /> : copied ? <Check className="size-4" aria-hidden /> : navigatorShareAvailable() ? <Share2 className="size-4" aria-hidden /> : <Download className="size-4" aria-hidden />}
          {sharing ? "Preparing…" : copied ? "Saved & copied" : "Save and share address"}
        </button>
      </div>
    </section>
  );
}

function navigatorShareAvailable(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success(label === "Copy deposit address" ? "Deposit address copied" : "Order reference copied");
    } catch {
      toast.error("Clipboard access is unavailable. Select and copy the text instead.");
    }
  }
  return (
    <button type="button" onClick={() => void copy()} aria-label={copied ? "Copied" : label} title={copied ? "Copied" : label} className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#2a2e37] text-slate-100 transition hover:bg-[#343a45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300", className)}>
      {copied ? <Check className="size-4 text-emerald-300" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </button>
  );
}
