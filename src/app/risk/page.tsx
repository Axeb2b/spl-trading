// <!-- Draft policy — legal review required before production launch. -->
import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, type LegalSection } from "@/components/sites/spl-trading/public/legal-doc";
import { PublicShell } from "@/components/sites/spl-trading/public/public-shell";

export const metadata: Metadata = {
  title: "Risk disclosure",
  description:
    "The risks of using SPL Trading: digital-asset volatility, no guaranteed returns, deposit and payout processing, and money-movement features that can be disabled.",
};

const INLINE_LINK = "font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400";

const SECTIONS: LegalSection[] = [
  {
    heading: "The short version",
    bullets: [
      "No return, yield, profit or interest is offered, promised or guaranteed anywhere in this service.",
      "Digital assets move in value, including assets described as stable.",
      "A deposit is credited only after independent verification; a payout passes review and can be rejected.",
      "Money-movement features are switched off by default and can be disabled at any time.",
      "A transfer sent on the wrong network, to the wrong address or in the wrong asset cannot be recovered.",
      "In a demo configuration no real funds move at all.",
    ],
  },
  {
    heading: "Digital asset volatility",
    paragraphs: [
      "Deposits are made in USDT and balances are recorded in USD. Both the asset you send and the value you are left with can move between the moment you send and the moment you act on it. Digital assets are volatile, and an asset presented as stable can still lose its peg.",
      "This service does not insure balances and does not participate in any deposit-guarantee or compensation scheme. What you hold here is a claim recorded in the ledger, not a protected deposit.",
    ],
  },
  {
    heading: "No guaranteed returns",
    paragraphs: [
      "SPL Trading is a money-movement cabinet. It does not trade on your behalf, does not credit interest or yield, and does not promise any multiple of what you put in. Nothing you read here, in the cabinet or in a support conversation is a commitment about what you will receive.",
      "Any number you see in the product is a record of activity that already happened. Nothing published here is a track record, a projection or a forecast.",
    ],
    extra: (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        The same rule is written into the{" "}
        <Link href="/terms" className={INLINE_LINK}>
          terms of service
        </Link>
        .
      </p>
    ),
  },
  {
    heading: "Deposit processing risk",
    bullets: [
      "Credit is not instant: a deposit is checked before the balance changes, and the check can take time or end in a rejection.",
      "The order asks for an exact amount and lapses if it is not paid within its window, after which a new order must be created.",
      "An unpaid or expired order carries no obligation to credit anything.",
      "A transfer sent on the wrong network, to the wrong address, or in the wrong asset is unrecoverable.",
      "Deposit limits are configuration, not a guarantee that a deposit will be accepted — the feature can also be switched off.",
    ],
  },
  {
    heading: "Payout processing risk",
    bullets: [
      "A payout request is held and reviewed before it settles, and can be rejected with a reason.",
      "The withdrawal fee is deducted from the amount requested, so what settles is net of that fee.",
      "Settlement depends on the destination and the network behind it, neither of which this platform controls.",
      "A request can fail after it starts processing, and the platform can stop accepting new requests at any time.",
    ],
  },
  {
    heading: "Money movement can be switched off",
    paragraphs: [
      "Deposits, withdrawals, referrals and investment features are disabled by default. They are turned on through platform configuration by an operator, and each one can be turned off again — including while a request is being made, in which case you will see a message that the feature is currently disabled rather than a silent failure.",
      "Some deployments run without live mode switched on at all, which keeps every money-movement feature off regardless of other settings. Rely on what your cabinet shows you at the moment you act, not on what a public page says is possible.",
    ],
  },
  {
    heading: "Demo and verification caveats",
    paragraphs: [
      "Some deployments run without live mode switched on at all. Where that is the case, balances, deposits and payouts are simulated and have no monetary value, and nothing done there can be withdrawn. The cabinet tells you which mode it is in: the indicator in the header reports the live status of your connection, and money-movement actions are disabled while the feature is off.",
      "Even where the platform is live, your balance reflects a verified transfer rather than a claim you make: verification is what stands between an unconfirmed payment and a credited one, and it can decline it.",
      "These public pages describe how the product is built and configured. They publish no performance figures, no user counts and no volume statistics, because none are defined in the product itself.",
    ],
  },
  {
    heading: "What falls to you",
    bullets: [
      "Check the network, asset and address every single time you send, not just the first.",
      "Read the limits and fees shown in the dialog before you confirm a request.",
      "Keep your sign-in details private; anyone holding them can act as you.",
      "Fund an account only with money you can afford to have tied up or lost.",
      "Treat any request for funds, credentials or codes from outside the cabinet with suspicion.",
    ],
  },
  {
    heading: "This is not advice",
    paragraphs: [
      "Nothing on this site is financial, legal, investment or tax advice, and nothing here takes account of your circumstances. If you need advice, get it from someone qualified to give it to you.",
    ],
    extra: (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Questions about how a specific request will be handled go through the{" "}
        <Link href="/contact" className={INLINE_LINK}>
          contact page
        </Link>
        ; the amounts that apply are on the{" "}
        <Link href="/fees" className={INLINE_LINK}>
          fees page
        </Link>
        .
      </p>
    ),
  },
];

export default function RiskPage() {
  return (
    <PublicShell>
      <LegalDoc
        eyebrow="Legal"
        title="Risk disclosure"
        lede="What can go wrong when funds move — written before you fund an account, not after something goes wrong."
        revised="10 October 2026"
        sections={SECTIONS}
      />
    </PublicShell>
  );
}
