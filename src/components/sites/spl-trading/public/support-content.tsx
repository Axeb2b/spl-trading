import { Info, LifeBuoy, MessageCircle } from "lucide-react";
import { PublicCard, PublicSection } from "./public-shell";

/** Shared body for /contact and /support — same channels, two entry points. */
export function SupportSections() {
  return (
    <>
      <PublicSection
        index="01 — Channels"
        title="How to reach support"
        lede="Support is handled through your account. This public site deliberately publishes no phone number, no email address and no channel handle."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <PublicCard
            title="In-app support"
            icon={<LifeBuoy className="size-4" aria-hidden />}
          >
            Sign in and open the “Need help?” panel on the Onboarding screen of your cabinet.
            Support is raised from inside your account, where it sits next to the records it refers
            to — no need to re-describe deposits and payouts.
          </PublicCard>

          <PublicCard
            title="Telegram"
            icon={<MessageCircle className="size-4" aria-hidden />}
          >
            The product&apos;s own onboarding copy points to Telegram as the support channel and
            describes it as available around the clock. No handle for it is published on this
            site — start from the in-app entry point instead, so a request stays tied to your
            signed-in account.
          </PublicCard>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/50">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
            <Info className="size-4" aria-hidden />
            No response-time commitment
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            Neither the product nor this page defines support hours or a guaranteed reply time.
            Anything you are told about timing comes from the team handling your request, not from
            a published service level.
          </p>
        </div>
      </PublicSection>

      <PublicSection
        index="02 — Preparing a request"
        title="What to include"
        lede="Including these details first time round avoids a round trip."
        className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "The email address on your account.",
            "The reference shown on the order — DEP-… for a deposit, WDR-… for a payout.",
            "The network and asset you sent, and roughly when.",
            "The amount, and the address or account it went to.",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            >
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-500" />
              {item}
            </li>
          ))}
        </ul>
      </PublicSection>

      <PublicSection
        index="03 — Scope"
        title="What support can and cannot do"
        lede="Being clear about the edges saves disappointment."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <PublicCard title="Support can">
            <ul className="space-y-2">
              <li>Explain the status of a deposit or payout and why it is in that state.</li>
              <li>Explain the fee and limits that apply to your request.</li>
              <li>Help with account details, sign-in problems and access.</li>
            </ul>
          </PublicCard>
          <PublicCard title="Support cannot">
            <ul className="space-y-2">
              <li>Recover a transfer sent on the wrong network or to the wrong address.</li>
              <li>Promise a processing time that the product itself does not define.</li>
              <li>Turn on a money-movement feature that is currently switched off.</li>
            </ul>
          </PublicCard>
        </div>
      </PublicSection>
    </>
  );
}
