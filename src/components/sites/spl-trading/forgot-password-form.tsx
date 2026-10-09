"use client";

import { useState } from "react";
import { AuthShell } from "./auth-shell";
import {
  AuthActions,
  AuthBanner,
  AuthField,
  type BannerKind,
} from "./auth-primitives";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(false);

  function submit() {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setNotice(true);
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Step 1 of 3 · enter your email"
      asideTitle="Get back into your account"
      asideText="Enter the email you registered with — we'll send a one-time code, and you'll set a new password."
      asideItems={[
        { text: "Code by email — arrives in seconds", icon: "mail" },
        { text: "Same code rules: 10 min, 5 attempts", icon: "lock" },
      ]}
      step={1}
      stepLabels={["Email", "Code", "New password"]}
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
          submit();
        }}
      >
        {notice ? (
          <AuthBanner
            kind={"info" as BannerKind}
            title="Local clone — no email is sent"
            text="Recovery is disconnected from sutra-reg.org. The source posts this address to /api/auth and emails a one-time code; here it stays in the page."
          />
        ) : null}
        <AuthField
          label="Email"
          value={email}
          type="email"
          placeholder="trader@example.com"
          autoComplete="email"
          error={error}
          hint="We will send a one-time recovery code to this address."
          onChange={(value) => {
            setEmail(value);
            setError("");
          }}
        />
        <AuthActions
          primaryLabel="Send code"
          disabled={!email.trim()}
          onPrimary={submit}
        />
      </form>
    </AuthShell>
  );
}
