import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { CabinetShell } from "@/components/sites/spl-trading/cabinet/cabinet-shell";
import { AdminConsole } from "@/components/sites/spl-trading/admin/admin-console";
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
      <CabinetShell title="Admin" email={user.email} name={user.name}>
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
            <ShieldAlert className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Access restricted</h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Your account does not hold the admin role. The administrative console is restricted to staff accounts.
          </p>
          <a
            href="https://moospage.com/users"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Open external admin
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </CabinetShell>
    );
  }

  return (
    <CabinetShell title="Admin" email={user.email} name={user.name}>
      <header className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Admin console</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-700 dark:text-slate-300">{user.email}</span> with the{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">admin</span> role.
        </p>
      </header>

      <AdminConsole />
    </CabinetShell>
  );
}
