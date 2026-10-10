// <!-- Draft policy — legal review required before production launch. -->
import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, type LegalSection } from "@/components/sites/spl-trading/public/legal-doc";
import { PublicShell } from "@/components/sites/spl-trading/public/public-shell";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms that apply to an SPL Trading account: what the cabinet is, no promised returns, deposits, payouts, fees and acceptable use.",
};

const INLINE_LINK = "font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400";

const SECTIONS: LegalSection[] = [
  {
    heading: "Accepting these terms",
    paragraphs: [
      "By creating an account or by using the cabinet, you accept these terms and the policies they link to. If you do not accept them, do not use the service.",
      "These terms apply to anyone who reads the public pages and, in full, to anyone who holds an account.",
    ],
  },
  {
    heading: "What the service is",
    paragraphs: [
      "SPL Trading provides a cabinet for holding a balance, creating deposit orders, keeping the accounts you pay out to, requesting payouts, and reading the records behind each of those steps.",
      "It is a tool for moving funds and keeping books. It is not a bank, not an exchange, and not an investment product.",
    ],
  },
  {
    heading: "No returns, yields or guarantees",
    paragraphs: [
      "The service does not offer interest, yield, profit share, guaranteed return, or any investment product. A balance does not grow by itself, and no feature of the cabinet credits a return to your account.",
      "Nothing on these public pages, inside the cabinet, or in a support message is investment advice or a promise about what you will receive. Figures you see are records of movement that already happened, never projections.",
    ],
  },
  {
    heading: "Your account",
    bullets: [
      "Provide accurate details at sign-up and keep them up to date.",
      "Keep your credentials secret. You are responsible for what happens under your account.",
      "Use the service only if a product of this kind is lawful where you live; the platform does not verify that for you.",
      "Understand that an account can be marked active, restricted or suspended by the platform as part of operating and protecting the service.",
    ],
  },
  {
    heading: "Fees, limits and configuration",
    paragraphs: [
      "Deposit minimums and maximums, the withdrawal fee and the minimum payout are platform settings and may change. The figures displayed to you inside the cabinet when you act are the ones that apply to that action.",
    ],
    extra: (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        The current defaults are published on the{" "}
        <Link href="/fees" className={INLINE_LINK}>
          fees page
        </Link>
        .
      </p>
    ),
  },
  {
    heading: "Deposits",
    bullets: [
      "Deposits are made in USDT on the BEP-20 network, to an address shown in the deposit dialog after you sign in. No receiving address is published on the public pages.",
      "Send the amount the order asks for. An order that is not paid in time expires and a new one must be created.",
      "A deposit is credited only after the transfer has been independently verified — not on the strength of a claim or a screenshot.",
      "A transfer sent on the wrong network, to the wrong address, or in the wrong asset cannot be recovered.",
      "The deposit feature can be switched off by the platform, in which case new deposit orders cannot be created.",
    ],
  },
  {
    heading: "Payouts",
    bullets: [
      "A payout must be sent to an account you have saved in the cabinet.",
      "A payout request is subject to a minimum amount and a fee, both shown before the request is confirmed.",
      "Requests move through pending, approved, processing and completed. A request can also be rejected with a reason, in which case the hold on your balance is released.",
      "The payout feature can be switched off by the platform, in which case new requests cannot be made.",
    ],
  },
  {
    heading: "Referral rewards",
    paragraphs: [
      "A reward is recorded when an account you referred has a qualifying credited deposit. It is paid only after approval, and it can be reversed if the underlying event is reversed. Referral features may be switched off, and no reward is owed while they are off.",
    ],
  },
  {
    heading: "Acceptable use",
    bullets: [
      "Do not use the service for unlawful activity, fraud, or to move funds you are not entitled to.",
      "Do not interfere with the service, probe it without permission, or attempt to bypass access controls.",
      "Do not use another person's account, and do not let another person use yours.",
      "Do not present a deposit as credited, or a payout as sent, when the cabinet does not show it that way.",
    ],
  },
  {
    heading: "Restriction, suspension and closure",
    paragraphs: [
      "Features and accounts can be restricted, suspended or closed where the platform has a reason to do so — including where records suggest misuse, or where a money-movement feature is being reconfigured. Where you ask support to close an account, it will be closed, and records that must be kept for accounting or legal reasons are retained after that.",
    ],
  },
  {
    heading: "Availability and disclaimers",
    paragraphs: [
      "The service is provided as it stands. Availability is not guaranteed: maintenance, configuration changes and events outside the platform's control can interrupt it, and a feature that was available yesterday may be switched off today.",
      "To the extent the law allows, the platform is not liable for indirect or consequential loss arising from use of the service, including loss caused by a transfer you sent to the wrong address or on the wrong network.",
    ],
    extra: (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Read the{" "}
        <Link href="/risk" className={INLINE_LINK}>
          risk disclosure
        </Link>{" "}
        before funding an account.
      </p>
    ),
  },
  {
    heading: "Changes to these terms",
    paragraphs: [
      "These terms may be updated. The revision date at the top changes when they are, and the version published on this page is the one that applies from that point on.",
    ],
  },
  {
    heading: "Operator details",
    paragraphs: [
      "The legal entity operating SPL Trading, together with its registered address and any detail the law requires to be stated here, will be published on this page before production launch. Until then this page is a draft of the terms, not a statement of who stands behind them.",
    ],
  },
  {
    heading: "Contact",
    extra: (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Questions about these terms go through the{" "}
        <Link href="/contact" className={INLINE_LINK}>
          contact page
        </Link>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <PublicShell>
      <LegalDoc
        eyebrow="Legal"
        title="Terms of service"
        lede="What you are agreeing to when you hold an account — written to describe the product as it is built, not as a promise of returns."
        revised="10 October 2026"
        sections={SECTIONS}
      />
    </PublicShell>
  );
}
