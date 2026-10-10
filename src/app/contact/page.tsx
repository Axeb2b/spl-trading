import type { Metadata } from "next";
import { PublicPageIntro, PublicShell } from "@/components/sites/spl-trading/public/public-shell";
import { SupportSections } from "@/components/sites/spl-trading/public/support-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to contact SPL Trading support: in-app support from your cabinet and the Telegram channel opened there. No phone numbers or email addresses are published.",
};

export default function ContactPage() {
  return (
    <PublicShell>
      <PublicPageIntro
        eyebrow="Contact"
        title="Talk to the team"
        lede="Support runs through your account. These are the channels that exist today — nothing on this page is a placeholder for a phone number or inbox that isn't there."
      />
      <SupportSections />
    </PublicShell>
  );
}
