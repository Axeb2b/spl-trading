import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { AdminOperations } from "@/components/sites/spl-trading/cabinet/admin-operations";
import { requirePageUser } from "@/lib/page-user";

export const metadata: Metadata = {
  title: "Admin operations",
  description: "Configure deposit gates and manually review verified on-chain payments and payout operations.",
};

export default async function AdminPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  if (user.role !== "admin") {
    return (
      <CabinetShell title="Admin" email={user.email} name={user.name}>
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900 sm:p-12">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <ShieldAlert className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Access restricted</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
            This account does not have the admin role. Deposit review and payout operations are available to authorized staff only.
          </p>
          <Link href="/" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200">
            Return to overview
          </Link>
        </section>
      </CabinetShell>
    );
  }

  return (
    <CabinetShell title="Admin operations" email={user.email} name={user.name}>
      <AdminOperations />
    </CabinetShell>
  );
}
