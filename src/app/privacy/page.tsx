// <!-- Draft policy — legal review required before production launch. -->
import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc, type LegalSection } from "@/components/sites/spl-trading/public/legal-doc";
import { PublicShell } from "@/components/sites/spl-trading/public/public-shell";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How SPL Trading collects and uses account details, ledger and transaction records, and the session cookie — and what you can ask for.",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "What this policy covers",
    paragraphs: [
      "This policy covers the SPL Trading website and the trader cabinet it links to: what information is collected, why it is used, how long it is kept, and what you can ask us to do. It applies both to visitors of these public pages and to account holders.",
      "These pages load no third-party analytics, advertising or tracking scripts. There is nothing of that kind on the site, which is why no consent banner appears here.",
    ],
  },
  {
    heading: "Information you give us",
    paragraphs: [
      "An account is created with the details you enter at sign-up, plus the records the platform needs to operate it.",
    ],
    bullets: [
      "Your name and email address, used to identify the account and to correspond with you about it.",
      "Your password, stored only as a salted scrypt hash — never in plain text.",
      "An optional referral code, which links a new account to the account that invited it.",
      "The account's role and status, set by the platform as part of operating the service.",
      "Timestamps for when the account was created and last updated.",
    ],
  },
  {
    heading: "Records created by your activity",
    paragraphs: [
      "Using the cabinet creates financial records. These exist so that a balance can be explained line by line, and so that support and review questions can be answered from evidence rather than memory.",
    ],
    bullets: [
      "Deposit orders: amount, network, status, internal reference, expiry, and who verified the transfer.",
      "Withdrawal requests: amount, fee, net amount, destination type and reference, status, transaction hash and who reviewed it.",
      "Ledger transactions and entries: the double-entry record behind every balance, including fees.",
      "Referral rewards: the qualifying event, the amount and whether it was paid, approved or reversed.",
      "Audit entries: which operator action was taken, against what, and when.",
    ],
  },
  {
    heading: "Cookies and local storage",
    paragraphs: [
      "A single session cookie, spl_session, is set when you sign in. It is a signed token carrying your account identity and an expiry of seven days; it is read on each request to keep you signed in and is cleared when you sign out.",
      "Your light or dark theme choice is kept in your browser's local storage under the key spl-trading-auth-theme. It stays on your device and is not transmitted to us.",
      "No advertising, analytics or third-party cookies are set by these pages.",
    ],
  },
  {
    heading: "How the information is used",
    bullets: [
      "To operate your account and keep you signed in.",
      "To verify deposits and to process payouts you request.",
      "To maintain the ledger, reports and audit trail that back your balance.",
      "To prevent fraud, abuse and unauthorised access.",
      "To answer support requests and resolve disputes.",
      "To meet legal obligations that apply to records of this kind.",
    ],
  },
  {
    heading: "Who it is shared with",
    paragraphs: [
      "Information is shared only where a step in the service needs it: with the operators of the platform, who run deposits, payouts and support; with service providers involved in verifying a transfer or settling a payout, limited to what that step requires; and with authorities where disclosure is legally required.",
      "Personal data is not sold, and it is not shared with advertisers — this site carries no advertising and no third-party trackers.",
    ],
  },
  {
    heading: "How long it is kept",
    paragraphs: [
      "Account details are kept while your account is active. Ledger, deposit, withdrawal and audit records are kept for as long as they are needed to keep the books correct and to answer disputes, support questions or legal obligations — which can outlive an account. Records are then deleted or anonymised.",
    ],
  },
  {
    heading: "Your choices and rights",
    bullets: [
      "Ask what information is held about you.",
      "Ask for corrections to information that is wrong.",
      "Ask for deletion, which may be refused only where records must be kept for legal or accounting reasons.",
      "Sign out at any time, which clears the session cookie immediately.",
      "Browse these public pages without an account; only the theme preference is stored locally.",
    ],
    extra: (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Requests are handled through{" "}
        <Link
          href="/contact"
          className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
        >
          in-app support
        </Link>
        . We may need to confirm the request comes from the account holder before acting on it.
      </p>
    ),
  },
  {
    heading: "Security",
    paragraphs: [
      "Passwords are hashed with scrypt using a per-account salt, session tokens are signed and compared in constant time, and operator actions are written to an audit log. Access to records is limited to what a role needs in order to do its job.",
      "No system is completely secure. Keep your password to yourself — support will never ask for it, and a signed-in session should be signed out on shared devices.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "When the way information is handled changes, this page is updated and the revision date at the top is changed. Continued use of the service after a change means the current version applies to you.",
    ],
    extra: (
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Questions about this policy go through{" "}
        <Link
          href="/contact"
          className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
        >
          the contact page
        </Link>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <PublicShell>
      <LegalDoc
        eyebrow="Legal"
        title="Privacy policy"
        lede="What is collected when you use these pages and the cabinet behind them, why it is used, and what you can ask for."
        revised="10 October 2026"
        sections={SECTIONS}
      />
    </PublicShell>
  );
}
