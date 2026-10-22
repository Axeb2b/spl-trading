import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AdminConsole } from "@/components/sites/spl-trading/cabinet/admin-console";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { requirePageUser } from "@/lib/page-user";

export const metadata: Metadata = {
  title: "Admin",
  description: "Administrative console",
};

export default async function AdminPage() {
  const user = await requirePageUser();
  if (!user) redirect("/auth/sign-in");

  if (user.role !== "admin") {
    return (
      <CabinetShell title="Admin" email={user.email} name={user.name} role={user.role}>
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
            <ShieldAlert className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
            Access restricted
          </h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Your account does not hold the admin role. The administrative console is restricted to
            staff accounts.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Back to dashboard
          </Link>
        </div>
      </CabinetShell>
    );
  }

  return (
    <CabinetShell title="Admin" email={user.email} name={user.name} role={user.role}>
      <AdminConsole />
    </CabinetShell>
  );
}
