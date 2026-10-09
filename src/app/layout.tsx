import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/components/sites/spl-trading/cabinet/cabinet.css";
import { ThemeApplier } from "@/components/sites/spl-trading/theme-toggle";
import { AppToaster } from "@/components/ui/app-toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SPL Trading",
    template: "%s · SPL Trading",
  },
  description: "Trader portal for balances, payouts and settlements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-auth-theme="light" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeApplier />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
