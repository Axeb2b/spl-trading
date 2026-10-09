"use client";

import { AlertTriangle } from "lucide-react";
import { CopyButton } from "./copy-button";
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
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {destination.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={destination.qrDataUrl}
            alt={`QR code for the ${destination.network} ${destination.asset} deposit address`}
            className="size-56 rounded-lg border border-slate-200 bg-white p-2"
            width={224}
            height={224}
          />
        ) : (
          <div className="flex size-56 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-400">
            {destination.configured
              ? "QR could not be generated. Use the address below."
              : "No receiving address is configured yet. Contact support."}
          </div>
        )}

        {amountCents !== undefined ? (
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">Send exactly</div>
            <div className="text-xl font-semibold tabular-nums text-slate-900">
              {formatAmount(amountCents)} {destination.asset}
            </div>
          </div>
        ) : null}
      </div>

      {destination.address ? (
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-medium text-slate-500">
            {destination.network} address ({destination.asset})
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
              {destination.address}
            </code>
            <CopyButton value={destination.address} label="Copy address" variant="button" />
          </div>
        </div>
      ) : null}

      {internalRef || expiresAt ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs">
          {internalRef ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Reference</span>
              <code className="font-mono text-slate-800">{internalRef}</code>
              <CopyButton value={internalRef} label="Copy reference" />
            </div>
          ) : null}
          {expiresAt ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Expires in</span>
              <Countdown expiresAt={expiresAt} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        role="alert"
        className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Confirm the network is <strong>{destination.network}</strong> and the asset is{" "}
          <strong>{destination.asset}</strong> before sending. Transfers sent on a different network
          cannot be recovered.
        </p>
      </div>
    </div>
  );
}