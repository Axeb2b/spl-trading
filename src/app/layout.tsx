import type { Metadata } from "next";
import "./globals.css";
import { ThemeApplier } from "@/components/sites/spl-trading/theme-toggle";
import { AppToaster } from "@/components/ui/app-toaster";

export const metadata: Metadata = {
  title: {
    default: "SPL Trading",
    template: "%s · SPL Trading",
  },
  description:
    "A clear account cabinet for USDT deposit orders, payout requests, and transaction records. Fees, risks, and feature availability are explained upfront.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-auth-theme="light">
      <body className="min-h-screen">
        <ThemeApplier />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
