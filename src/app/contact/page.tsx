import type { Metadata } from "next";
import { PublicPageIntro, PublicShell } from "@/components/sites/spl-trading/public/public-shell";
import { SupportSections } from "@/components/sites/spl-trading/public/support-content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to find the support options configured for an SPL Trading deployment and what to include in a request.",
};

export default function ContactPage() {
  return (
    <PublicShell>
      <PublicPageIntro
        eyebrow="Contact"
        title="Talk to the team"
        lede="Support options depend on the deployment. Use only the contact path shown in your signed-in cabinet or provided by your platform operator; this page does not invent an address or handle."
      />
      <SupportSections />
    </PublicShell>
  );
}
