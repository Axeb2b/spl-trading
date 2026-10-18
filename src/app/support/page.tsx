import type { Metadata } from "next";
import { PublicPageIntro, PublicShell } from "@/components/sites/spl-trading/public/public-shell";
import { SupportSections } from "@/components/sites/spl-trading/public/support-content";

export const metadata: Metadata = {
  title: "Support",
  description:
    "How to find the support options configured for your SPL Trading account and what information to include in a request.",
};

export default function SupportPage() {
  return (
    <PublicShell>
      <PublicPageIntro
        eyebrow="Support"
        title="Help with your account"
        lede="Support options vary by deployment. If your cabinet includes a support link, use it with the order reference and transfer details; otherwise follow the contact route provided by your platform operator."
      />
      <SupportSections />
    </PublicShell>
  );
}
