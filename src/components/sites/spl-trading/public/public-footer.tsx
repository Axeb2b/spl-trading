import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLockup } from "../brand";
import { FOOTER_COLUMNS } from "./public-links";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0c1d18] text-slate-300">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[1.45fr_repeat(4,minmax(0,1fr))]">
        <div className="max-w-sm">
          <BrandLockup inverse />
          <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
            Deposits, payout requests, and transaction records in one straightforward account cabinet.
          </p>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            SPL Trading is a money-movement service. It does not offer or promise investment returns.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col items-start gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {column.title}
            </p>
            {column.links.map((link) => (
              <Link
                key={`${column.title}-${link.href}`}
                href={link.href}
                className="group inline-flex items-center gap-1 text-sm text-slate-300 underline-offset-4 transition hover:text-lime-200 hover:underline"
              >
                {link.label}
                <ArrowUpRight className="size-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden />
              </Link>
            ))}
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-5 text-xs leading-relaxed text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>© {year} SPL Trading. Amounts are shown in USD.</p>
          <p className="max-w-2xl md:text-right">
            No return, yield, or profit is promised. Review the{" "}
            <Link href="/risk" className="text-slate-300 underline-offset-4 hover:text-white hover:underline">
              risk disclosure
            </Link>{" "}
            and current fees before moving funds.
          </p>
        </div>
      </div>
    </footer>
  );
}
