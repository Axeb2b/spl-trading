"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "./auth-shell";
import {
  AuthActions,
  AuthBanner,
  AuthField,
  AuthPasswordField,
  type BannerKind,
} from "./auth-primitives";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  referral?: string;
};

export function SignUpFlow() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referral, setReferral] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{ kind: BannerKind; title: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const valid =
    name.trim().length > 0 &&
    EMAIL_RE.test(email.trim()) &&
    password.length >= MIN_PASSWORD &&
    password === confirm;

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Full name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) next.confirm = "Passwords do not match.";
    return next;
  }

  async function submit() {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setBanner({ kind: "error", title: "Check the form", text: "Some fields need attention." });
      return;
    }

    setLoading(true);
    setBanner(null);
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          referralCode: referral.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success("Account created", {
          description: "A verified $500 deposit is required to unlock payout features.",
        });
        router.replace("/");
        router.refresh();
        return;
      }

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.status === 409) {
        setErrors({ email: data.error ?? "This email is already registered." });
        setBanner({ kind: "error", title: "Email already used", text: data.error ?? "Try signing in instead." });
        return;
      }
      setBanner({
        kind: "error",
        title: "Could not create account",
        text: data.error ?? "Try again in a moment.",
      });
    } catch {
      setBanner({
        kind: "error",
        title: "Connection problem",
        text: "Could not reach the server. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register to start depositing and tracking payouts"
      asideTitle="Start with a clear account view"
      asideText="Create your account to open the cabinet, review supported features, and follow transaction activity where enabled."
      headLinkText="Already registered?"
      headLinkCta="Sign In"
      headLinkTo="/auth/sign-in"
      footText="Already registered?"
      footCta="Sign In"
      footLinkTo="/auth/sign-in"
      footMobileOnly
    >
      <AuthBanner kind={banner?.kind ?? null} title={banner?.title} text={banner?.text} />
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <AuthField
          label="Full name"
          value={name}
          placeholder="Your name"
          autoComplete="name"
          error={errors.name}
          onChange={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
        />
        <AuthField
          label="Email"
          value={email}
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          onChange={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
        />
        <AuthPasswordField
          label="Password"
          value={password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password}
          onChange={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined, confirm: undefined }));
          }}
        />
        <AuthPasswordField
          label="Confirm password"
          value={confirm}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirm}
          onChange={(value) => {
            setConfirm(value);
            setErrors((current) => ({ ...current, confirm: undefined }));
          }}
        />
        <AuthField
          label="Referral code (optional)"
          value={referral}
          placeholder="ABCD1234"
          error={errors.referral}
          hint="Use the code from your referral link, if you have one."
          onChange={(value) => setReferral(value.toUpperCase())}
        />
        <AuthActions
          primaryLabel="Create account"
          loadingLabel="Creating account"
          loading={loading}
          disabled={!valid || loading}
        />
      </form>
    </AuthShell>
  );
}