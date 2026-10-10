import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { TradingView } from "@/components/sites/spl-trading/cabinet/trading-view";
import { requirePageUser } from "@/lib/page-user";

export const metadata: Metadata = {
  title: "Trading",
  description: "USDT trading accounts, buy and sell orders, and order history",
};

export default async function TradingPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  return (
    <CabinetShell title="Trading" email={user.email} name={user.name}>
      <TradingView />
    </CabinetShell>
  );
}
