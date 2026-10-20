"use client";

import { useState } from "react";
import { AuthShell } from "./auth-shell";
import { AuthActions, AuthBanner, AuthField, type BannerKind } from "./auth-primitives";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password recovery is a support handoff.
 *
 * The previous build showed a three-step "code by email" flow that never sent
 * a code and ended on an informational alert. This form creates a real
 * support request and says exactly what happens next.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/v1/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), message: message.trim() || undefined }),
      });
      const data = (await response.json()) as { message?: string; requestId?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not submit the request.");
        return;
      }
      setNotice(data.message ?? "If an account exists for that address, support will reply.");
    } catch {
      setError("Connection problem. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Account recovery"
      subtitle="Support handles password recovery"
      asideTitle="Get back into your account"
      asideText="Tell us the address on the account and any reference that helps us find you — a deposit reference, or the name on the payout account."
      asideItems={[
        { text: "Requests are reviewed by a human", icon: "mail" },
        { text: "We never ask for your password", icon: "lock" },
      ]}
      headLinkText="Remember it?"
      headLinkCta="Sign in"
      headLinkTo="/auth/sign-in"
      footText="Remember your password?"
      footCta="Sign in"
      footLinkTo="/auth/sign-in"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {notice ? (
          <AuthBanner
            kind={"info" as BannerKind}
            title="Request received"
            text={notice}
          />
        ) : null}

        {!notice ? (
          <>
            <AuthField
              label="Email"
              value={email}
              type="email"
              placeholder="trader@example.com"
              autoComplete="email"
              error={error}
              hint="We never confirm whether an address is registered."
              onChange={(value) => {
                setEmail(value);
                setError("");
              }}
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Anything support should know (optional)
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="The last deposit reference, or the name on your payout account."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-100"
              />
            </label>

            <AuthActions
              primaryLabel={busy ? "Submitting…" : "Request recovery"}
              disabled={!email.trim() || busy}
              onPrimary={() => void submit()}
            />
          </>
        ) : null}
      </form>
    </AuthShell>
  );
}
