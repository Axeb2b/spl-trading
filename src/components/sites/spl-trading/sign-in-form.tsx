"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "./auth-shell";
import {
  AuthActions,
  AuthBanner,
  AuthField,
  AuthPasswordField,
  type BannerKind,
} from "./auth-primitives";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SignInFormProps = {
  headLinkText: string;
  headLinkCta: string;
  headLinkTo: string;
};

export function SignInForm({ headLinkText, headLinkCta, headLinkTo }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<{ kind: BannerKind; title: string; text: string } | null>(
    null,
  );

  const valid = Boolean(email.trim() && password);

  async function submit() {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";

    setErrors(next);

    if (Object.keys(next).length > 0) {
      setBanner({
        kind: "error",
        title: "Fill in the required fields",
        text: "Email and password are required.",
      });
      return;
    }

    setLoading(true);
    setBanner(null);
    try {
      const local = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (local.ok) {
        router.replace("/");
        router.refresh();
        return;
      }

      const localData = (await local.json().catch(() => ({}))) as { error?: string };

      setBanner({
        kind: "error",
        title: local.status === 401 || local.status === 404 ? "Wrong email or password" : "Sign-in problem",
        text: localData.error ?? "Check your details and try again.",
      });
      return;
    } catch {
      setBanner({
        kind: "error",
        title: "Connection problem",
        text: "Could not reach the sign-in service. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back!"
      subtitle="Sign in to your trader account"
      asideTitle="Welcome back to your account"
      asideText="Sign in to review your balance, deposit orders, payout activity, and transaction records."
      headLinkText={headLinkText}
      headLinkCta={headLinkCta}
      headLinkTo={headLinkTo}
      footText="New here?"
      footCta="Sign Up"
      footLinkTo="/auth/sign-up"
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
          label="Email"
          value={email}
          type="email"
          placeholder="trader@example.com"
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
          placeholder="Password"
          autoComplete="current-password"
          error={errors.password}
          onChange={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        <div className="flex justify-end text-sm">
          <a
            href="/auth/forgot-password"
            className="font-medium text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-100"
          >
            Forgot password?
          </a>
        </div>
        <AuthActions
          primaryLabel="Sign In"
          loadingLabel="Signing in"
          loading={loading}
          disabled={!valid || loading}
        />
      </form>
    </AuthShell>
  );
}
