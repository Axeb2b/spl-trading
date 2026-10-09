import type { Metadata } from "next";
import { SignUpFlow } from "@/components/sites/spl-trading/sign-up-flow";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your SPL Trading account",
};

export default function SignUpPage() {
  return <SignUpFlow />;
}