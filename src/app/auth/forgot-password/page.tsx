import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/sites/spl-trading/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Get back into your account",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
