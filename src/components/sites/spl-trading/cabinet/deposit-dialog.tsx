"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, Info, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { MoneyInput } from "@/components/ui/money-input";
import { QrPanel, type QrPanelData } from "@/components/ui/qr-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DepositOrderDto = {
  id: string;
  internalRef: string;
  amountCents: number;
  status: string;
  expiresAt: string | null;
};

type DepositDialogProps = {
  depositsEnabled: boolean;
  onClose: () => void;
};

export function DepositDialog({ depositsEnabled, onClose }: DepositDialogProps) {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState<QrPanelData | null>(null);
  const [limits, setLimits] = useState<{ minCents: number; maxCents: number } | null>(null);
  const [order, setOrder] = useState<DepositOrderDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(depositsEnabled);
  const [configError, setConfigError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!depositsEnabled) return;
    let cancelled = false;

    fetch("/api/v1/deposits", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load deposit details.");
        return (await response.json()) as {
          destination?: QrPanelData;
          limits?: { minCents: number; maxCents: number };
        };
      })
      .then((data) => {
        if (cancelled) return;
        if (data.destination) setDestination(data.destination);
        if (data.limits) setLimits(data.limits);
        if (!data.destination?.configured) setConfigError("A valid receiving address is not configured for this deployment.");
      })
      .catch(() => {
        if (!cancelled) setConfigError("Deposit details could not be loaded. Close this window and try again.");
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });

    return () => { cancelled = true; };
  }, [depositsEnabled]);

  async function createOrder() {
    if (!depositsEnabled || !destination?.configured) return;
    const cents = Math.round(Number.parseFloat(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (limits && (cents < limits.minCents || cents > limits.maxCents)) {
      setError(`Amount must be between $${(limits.minCents / 100).toFixed(2)} and $${(limits.maxCents / 100).toFixed(2)}.`);
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
      if (!data.deposit || !data.destination?.configured) {
        setError("The response was incomplete. Check your deposit history before retrying.");
        return;
      }
      setOrder(data.deposit);
      setDestination(data.destination);
      toast.success("Deposit order created", {
        description: "Review the network, exact amount, reference, and expiry before sending.",
      });
    } catch {
      setError("Connection problem. Check deposit history before retrying.");
    } finally {
      setLoading(false);
    }
  }

  const unavailableMessage = !depositsEnabled
    ? "Deposit orders are disabled for this deployment. No receiving address is displayed and no order can be created."
    : configError;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="dark flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none border-[#30343c] bg-[#17191f] p-0 text-white shadow-2xl shadow-black/40 sm:h-auto sm:max-h-[min(92vh,58rem)] sm:max-w-xl sm:rounded-[1.5rem]">
        <DialogHeader className="shrink-0 border-b border-white/[0.08] bg-[#17191f] px-5 py-4 pr-14 text-left sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#ffda3d] text-[#17191f]">
              {order ? <ShieldCheck className="size-[18px]" aria-hidden /> : <ArrowDownToLine className="size-[18px]" aria-hidden />}
            </span>
            <div>
              <DialogTitle className="text-base font-semibold tracking-[-0.02em] text-white">
                {order ? "Deposit order" : "Deposit USDT"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-slate-400">
                BSC · BNB Smart Chain (BEP-20)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          {order && destination ? (
            <>
              <div className="mb-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3.5 text-xs leading-5 text-emerald-50/90">
                <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4 text-emerald-300" aria-hidden />Order created — awaiting transfer and verification</p>
                <p className="mt-1.5 text-emerald-50/75">Send the exact amount below. Your balance changes only after an operator independently verifies the BSC transaction.</p>
              </div>
              <QrPanel
                destination={destination}
                amountCents={order.amountCents}
                internalRef={order.internalRef}
                expiresAt={order.expiresAt}
              />
            </>
          ) : depositsEnabled && configLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-300" role="status">
              <LoaderCircle className="size-4 animate-spin" aria-hidden /> Checking network, receiving-address setup, and deposit limits…
            </div>
          ) : unavailableMessage ? (
            <div className="rounded-2xl border border-white/10 bg-[#20242b] p-2">
              <EmptyState
                icon={Info}
                title={depositsEnabled ? "Deposit setup incomplete" : "Deposits are turned off"}
                description={unavailableMessage}
                className="py-10 text-slate-200 [&_h2]:text-white [&_p]:text-slate-400"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#20242b] p-4 text-xs leading-5 text-slate-300">
                <p className="font-semibold text-white">A verified $500 deposit unlocks payout requests.</p>
                <p className="mt-1">Your order minimum is {limits ? `$${(limits.minCents / 100).toFixed(2)}` : "$500.00"}. Deposits are manually verified; a pending order does not unlock account features.</p>
              </div>
              <MoneyInput
                id="deposit-amount"
                label="Amount to deposit"
                value={amount}
                onChange={(value) => { setAmount(value); setError(null); }}
                currency="USD"
                minCents={limits?.minCents ?? 50_000}
                maxCents={limits?.maxCents}
                error={error ?? undefined}
                hint="The order is recorded in USD cents; send the exact displayed amount in USDT."
              />
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-3.5 text-xs leading-5 text-amber-50/90">
                <Info className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
                <p>Crypto transfers are generally irreversible. Do not send until the order has been created and the network, asset, exact amount, and address are visible.</p>
              </div>
              {error ? <p role="alert" className="text-xs font-semibold text-red-300">{error}</p> : null}
              <button
                type="button"
                disabled={loading || !destination?.configured}
                onClick={createOrder}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ffda3d] px-4 text-sm font-bold text-[#17191f] transition hover:bg-[#ffe46a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
                {loading ? "Creating order…" : "Create deposit order"}
              </button>
              <p className="text-center text-[10px] leading-5 text-slate-500">No funds are moved by creating an order. You choose whether to send after reviewing its details.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
