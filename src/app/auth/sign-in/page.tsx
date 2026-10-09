import type { Metadata } from "next";
import { SignInForm } from "@/components/sites/spl-trading/sign-in-form";

export const metadata: Metadata = {
  title: "Welcome back!",
  description: "Sign in to your trader account",
};

export default function SignInPage() {
  return (
    <SignInForm headLinkText="New here?" headLinkCta="Sign Up" headLinkTo="/auth/sign-up" />
  );
}
