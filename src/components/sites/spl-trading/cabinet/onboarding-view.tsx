import Link from "next/link";
import { CheckCircle2, CircleDashed, HelpCircle, Percent } from "lucide-react";

type Module = {
  id: string;
  title: string;
  body: string;
  cta?: string;
  href?: string;
};

const MODULES: Module[] = [
  {
    id: "welcome",
    title: "Welcome to SPL TRADING",
    body: "12 short steps to get you fully set up. Finish Telegram, deposit, and add your first payout account to start trading.",
  },
  {
    id: "telegram",
    title: "Connect Telegram",
    body: "Link your Telegram account so you can receive notifications and support 24/7.",
  },
  {
    id: "deposit",
    title: "Make your first deposit",
    body: "Top up your account with USDT (minimum 2000 USDT) to unlock the dashboard and start trading.",
    cta: "Go to deposit",
    href: "/",
  },
  {
    id: "accounts",
    title: "Add a payout account",
    body: "Add at least one bank account or e-wallet so we can route your payouts correctly.",
    cta: "Open accounts",
    href: "/accounts",
  },
  {
    id: "verify",
    title: "Complete verification",
    body: "Upload your ID and a selfie to verify your identity. Verification usually takes under 5 minutes.",
  },
  {
    id: "limits",
    title: "Set your limits",
    body: "Choose your daily payin / payout limits and settlement schedule. You can change these anytime.",
  },
  {
    id: "payouts",
    title: "Create your first payout",
    body: "Send a test payout to one of your accounts to confirm the full round-trip works.",
    cta: "Open payouts",
    href: "/payouts",
  },
  {
    id: "api",
    title: "Connect the API (optional)",
    body: "If you have a website or app, plug in our REST API to automate payins and payouts.",
  },
  {
    id: "webhooks",
    title: "Set up webhooks (optional)",
    body: "Get real-time callbacks on every payin / payout status change.",
  },
  {
    id: "settlement",
    title: "Configure settlement",
    body: "Choose how often we settle your balance to your bank or crypto wallet.",
  },
  {
    id: "team",
    title: "Invite your team (optional)",
    body: "Add operators and analysts with role-based access.",
  },
  {
    id: "done",
    title: "You're all set!",
    body: "Head back to the dashboard to start monitoring payins and payouts in real time.",
    cta: "Back to home",
    href: "/",
  },
];

const COMPLETED = 1;
const TOTAL = MODULES.length;

export function OnboardingView() {
  const progress = Math.round((COMPLETED / TOTAL) * 100);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ol className="flex-1 space-y-3">
        {MODULES.map((module, index) => {
          const done = index < COMPLETED;
          return (
            <li
              key={module.id}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  done
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {done ? <CheckCircle2 className="size-4" aria-hidden /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {module.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{module.body}</p>
                {module.cta && module.href ? (
                  <Link
                    href={module.href}
                    className="mt-3 inline-flex h-9 items-center rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {module.cta}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <aside className="w-full space-y-4 lg:w-72">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <HelpCircle className="size-4 text-slate-400" aria-hidden />
            Need help?
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Stuck on a step? Support is available 24/7 in Telegram and via email.
          </p>
          <button
            type="button"
            className="mt-4 h-9 w-full rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Contact support
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <Percent className="size-4 text-slate-400" aria-hidden />
            Progress
          </h2>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
            {progress}%
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <CircleDashed className="size-3.5" aria-hidden />
            {COMPLETED} of {TOTAL} modules complete
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="img"
            aria-label={`Onboarding ${progress} percent complete`}
          >
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </aside>
    </div>
  );
}
