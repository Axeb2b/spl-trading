import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { PayinsView, type PayinRow } from "@/components/sites/spl-trading/cabinet/payins-view";
import { requirePageUser } from "@/lib/page-user";
import { listDepositOrders } from "@/lib/deposits";

export const metadata: Metadata = {
  title: "Payins",
  description: "Search and review USDT deposit order statuses and references.",
};

export default async function PayinsPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  const rows: PayinRow[] = (await listDepositOrders(user.id)).map((order) => ({
    id: order.id,
    reference: order.internalRef,
    amountCents: order.amountCents,
    network: order.network,
    status: order.status,
    createdAt: order.createdAt,
  }));

  return (
    <CabinetShell title="Deposits" email={user.email} name={user.name}>
      <PayinsView rows={rows} />
    </CabinetShell>
  );
}
