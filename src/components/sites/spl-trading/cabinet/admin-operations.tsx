"use client";

import { useState } from "react";
import { ClipboardCheck, Settings2, WalletCards } from "lucide-react";
import { AdminConfiguration } from "./admin-configuration";
import { AdminDepositQueue } from "./admin-deposit-queue";
import { AdminPayoutQueue } from "./admin-payout-queue";

type Section = "setup" | "deposits" | "payouts";

const SECTIONS: { id: Section; label: string; icon: typeof Settings2 }[] = [
  { id: "setup", label: "Deposit setup", icon: Settings2 },
  { id: "deposits", label: "Deposit review", icon: ClipboardCheck },
  { id: "payouts", label: "Payout operations", icon: WalletCards },
];

export function AdminOperations() {
  const [section, setSection] = useState<Section>("setup");

  return (
    <div>
      <nav aria-label="Admin sections" className="mb-5 flex flex-wrap gap-2">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSection(item.id)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition ${active ? "border-[#191c22] bg-[#191c22] text-white dark:border-[#ffda3d] dark:bg-[#ffda3d] dark:text-[#17191f]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              <Icon className="size-4" aria-hidden /> {item.label}
            </button>
          );
        })}
      </nav>
      {section === "setup" ? <AdminConfiguration /> : null}
      {section === "deposits" ? <AdminDepositQueue /> : null}
      {section === "payouts" ? <AdminPayoutQueue /> : null}
    </div>
  );
}
