import type { Metadata } from "next";
import { SEO } from "@/components/sites/spl-trading/public/seo";
import { PublicPageIntro, PublicShell } from "@/components/sites/spl-trading/public/public-shell";
import { SupportSections } from "@/components/sites/spl-trading/public/support-content";

export const metadata: Metadata = SEO.default({
      title: "Support",
      description: "Getting help with an SPL Trading account: in-app support, the Telegram channel opened from the cabinet, and what to include in a request.",
      path: "/support",
    });

export default function SupportPage() {
  return (
    <PublicShell>
      <PublicPageIntro
        eyebrow="Support"
        title="Help with your account"
        lede="The same channels as the contact page, with the practical detail of what to send so a request can be picked up without a round trip."
      />
      <SupportSections />
    </PublicShell>
  );
}
