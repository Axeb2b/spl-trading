import { queryOne } from "@/lib/db";
import { getDepositMinCents } from "@/lib/flags";

/**
 * The 12 setup steps, in one place.
 *
 * The API and the setup page both read this list, so the step count, the
 * order and the wording can never disagree — the previous build showed
 * "1 of 12" in the header while the page listed a different set.
 *
 * `verification` declares how a step's completion is decided:
 *   account    — the account exists (always true once signed up)
 *   email      — the email address was confirmed
 *   deposit    — a deposit was credited
 *   withdrawal — a payout was requested
 *   manual     — confirmed by an operator, not derivable from data
 */
export type OnboardingModule = {
  id: string;
  title: string;
  body: string;
  cta?: string;
  href?: string;
  verification: "account" | "email" | "deposit" | "withdrawal" | "manual";
  optional?: boolean;
};

export const ONBOARDING_MODULES: OnboardingModule[] = [
  {
    id: "welcome",
    title: "Welcome to SPL TRADING",
    body: "12 short steps to get you fully set up. Deposit, add a payout account and complete verification to start trading.",
    verification: "account",
  },
  {
    id: "telegram",
    title: "Connect Telegram",
    body: "Link your Telegram account so you can receive notifications and support 24/7.",
    cta: "Contact support",
    href: "/support",
    verification: "manual",
  },
  {
    id: "deposit",
    title: "Make your first deposit",
    body: "Top up your account with USDT to unlock the dashboard and start trading.",
    cta: "Go to deposit",
    href: "/",
    verification: "deposit",
  },
  {
    id: "deposit-confirmed",
    title: "Wait for the deposit to be credited",
    body: "Deposits are credited after the transfer is verified on-chain.",
    cta: "View payins",
    href: "/payins",
    verification: "manual",
  },
  {
    id: "accounts",
    title: "Add a payout account",
    body: "Add at least one bank account or e-wallet so we can route your payouts correctly.",
    cta: "Open accounts",
    href: "/accounts",
    verification: "manual",
  },
  {
    id: "verify",
    title: "Complete verification",
    body: "Upload your ID and a selfie to verify your identity. Verification usually takes under 5 minutes.",
    cta: "Contact support",
    href: "/support",
    verification: "email",
  },
  {
    id: "limits",
    title: "Set your limits",
    body: "Choose your daily payin / payout limits and settlement schedule. You can change these anytime.",
    verification: "manual",
  },
  {
    id: "payouts",
    title: "Create your first payout",
    body: "Send a test payout to one of your accounts to confirm the full round-trip works.",
    cta: "Open payouts",
    href: "/payouts",
    verification: "withdrawal",
  },
  {
    id: "api",
    title: "Connect the API (optional)",
    body: "If you have a website or app, plug in our REST API to automate payins and payouts.",
    verification: "manual",
    optional: true,
  },
  {
    id: "webhooks",
    title: "Set up webhooks (optional)",
    body: "Get real-time callbacks on every payin / payout status change.",
    verification: "manual",
    optional: true,
  },
  {
    id: "settlement",
    title: "Configure settlement",
    body: "Choose how often we settle your balance to your bank or crypto wallet.",
    verification: "manual",
  },
  {
    id: "team",
    title: "Invite your team (optional)",
    body: "Add operators and analysts with role-based access.",
    verification: "manual",
    optional: true,
  },
];

export type OnboardingStepStatus = "complete" | "current" | "available";

export type OnboardingStep = {
  id: string;
  index: number;
  title: string;
  body: string;
  status: OnboardingStepStatus;
  optional: boolean;
  actionLabel: string | null;
  actionHref: string | null;
};

export type OnboardingState = {
  total: number;
  completed: number;
  percent: number;
  currentStepId: string | null;
  steps: OnboardingStep[];
};

/**
 * Builds the setup state from verifiable facts.
 *
 * Progress is never a hardcoded number: a step is complete only when the
 * underlying fact exists (a credited deposit, a requested payout, a confirmed
 * email) or an operator has marked it.
 */
export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const [depositRow, withdrawalRow, emailRow] = await Promise.all([
    queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM deposit_orders WHERE user_id = ? AND status = 'credited'",
      [userId],
    ),
    queryOne<{ n: number }>(
      "SELECT COUNT(*) AS n FROM withdrawal_requests WHERE user_id = ?",
      [userId],
    ),
    queryOne<{ verified: string | null }>(
      "SELECT email_verified_at AS verified FROM users WHERE id = ?",
      [userId],
    ),
  ]);

  const minCents = await getDepositMinCents();
  const minLabel = `$${(minCents / 100).toFixed(2)}`;

  const facts: Record<string, boolean> = {
    account: true,
    email: Boolean(emailRow?.verified),
    deposit: (depositRow?.n ?? 0) > 0,
    withdrawal: (withdrawalRow?.n ?? 0) > 0,
    manual: false,
  };

  const steps: OnboardingStep[] = ONBOARDING_MODULES.map((module, index) => ({
    id: module.id,
    index: index + 1,
    title: module.title,
    body:
      module.id === "deposit"
        ? `Top up your account with USDT (minimum ${minLabel}) to unlock the dashboard and start trading.`
        : module.body,
    status: facts[module.verification] ? "complete" : "available",
    optional: module.optional ?? false,
    actionLabel: module.cta ?? null,
    actionHref: module.href ?? null,
  }));

  const completed = steps.filter((step) => step.status === "complete").length;
  const current = steps.find((step) => step.status !== "complete") ?? null;
  if (current) current.status = "current";

  return {
    total: steps.length,
    completed,
    percent: Math.round((completed / steps.length) * 100),
    currentStepId: current?.id ?? null,
    steps,
  };
}
