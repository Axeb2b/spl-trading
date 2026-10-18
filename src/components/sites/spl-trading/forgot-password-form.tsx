import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { AuthShell } from "./auth-shell";

export function ForgotPasswordForm() {
  return (
    <AuthShell
      title="Password recovery"
      subtitle="Self-service password reset is not configured for this deployment."
      asideTitle="Need help getting back in?"
      asideText="This page does not send a recovery email or one-time code. Contact the platform operator through the support channel provided for your account."
      asideItems={[
        { text: "No email or code is sent from this page" },
        { text: "Never share your password or sign-in codes" },
      ]}
      headLinkText="Remember it?"
      headLinkCta="Sign in"
      headLinkTo="/auth/sign-in"
      footText="Ready to try again?"
      footCta="Sign in"
      footLinkTo="/auth/sign-in"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/70 dark:bg-amber-950/30">
          <CircleHelp className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Password reset is unavailable here</p>
            <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-200/80">
              No recovery email will be sent. Please use the support contact supplied by your platform operator to verify your identity and restore access.
            </p>
          </div>
        </div>
        <Link
          href="/auth/sign-in"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
