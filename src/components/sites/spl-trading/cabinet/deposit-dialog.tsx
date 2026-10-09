"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/ui/money-input";
import { QrPanel, type QrPanelData } from "@/components/ui/qr-panel";
import { EmptyState } from "@/components/ui/empty-state";

type DepositOrderDto = {
  id: string;
  internalRef: string;
  amountCents: number;
  status: string;
  expiresAt: string | null;
};

type DepositDialogProps = {
  onClose: () => void;
};

export function DepositDialog({ onClose }: DepositDialogProps) {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState<QrPanelData | null>(null);
  const [limits, setLimits] = useState<{ minCents: number; maxCents: number } | null>(null);
  const [order, setOrder] = useState<DepositOrderDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/deposits")
      .then((response) => response.json())
      .then((data: { destination?: QrPanelData; limits?: { minCents: number; maxCents: number } }) => {
        if (cancelled) return;
        if (data.destination) setDestination(data.destination);
        if (data.limits) setLimits(data.limits);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function createOrder() {
    const cents = Math.round(Number.parseFloat(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: cents }),
      });
      const data = (await response.json()) as {
        error?: string;
        deposit?: DepositOrderDto;
        destination?: QrPanelData;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not create deposit order.");
        return;
      }
      if (data.deposit) setOrder(data.deposit);
      if (data.destination) setDestination(data.destination);
      toast.success("Deposit order created", {
        description: "Send the exact amount using the details shown.",
      });
    } catch {
      setError("Connection problem. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Deposit funds"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close deposit dialog"
          className="absolute right-3 top-3 rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>

        {order && destination ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold">Deposit created</h2>
              <p className="text-sm text-slate-500">
                Send the exact amount below. Funds are credited after the transfer is verified on-chain.
              </p>
            </div>
            <QrPanel
              destination={destination}
              amountCents={order.amountCents}
              internalRef={order.internalRef}
              expiresAt={order.expiresAt}
            />
            <p className="text-sm text-slate-500">
              Keep your reference for support requests. Verification requires a confirmed
              transaction on {destination.network}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold">Deposit funds</h2>
              <p className="text-sm text-slate-500">
                Fund your account with USDT on BNB Smart Chain (BEP-20).
              </p>
            </div>

            <MoneyInput
              id="deposit-amount"
              label="Amount (USD)"
              value={amount}
              onChange={setAmount}
              currency="USD"
              minCents={limits?.minCents}
              maxCents={limits?.maxCents}
              error={error ?? undefined}
            />

            <button
              type="button"
              disabled={loading}
              onClick={createOrder}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating order…" : "Create deposit order"}
            </button>

            {!destination?.configured ? (
              <EmptyState
                title="Deposits are not available yet"
                description="No receiving address is configured. Contact support to fund your account."
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}