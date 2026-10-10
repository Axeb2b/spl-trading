import Link from "next/link";
import { FOOTER_COLUMNS } from "./public-links";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-slate-900 text-slate-300">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]">
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-white text-[11px] font-bold text-slate-900">
              SP
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">SPL Trading</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            A trader cabinet for deposits, payouts, accounts and reporting. Public pages describe the
            product as it is configured today.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {column.title}
            </p>
            {column.links.map((link) => (
              <Link
                key={`${column.title}-${link.href}`}
                href={link.href}
                className="w-fit text-sm text-slate-300 underline-offset-4 transition hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs leading-relaxed text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} SPL Trading. Amounts are shown in USD.
          </p>
          <p>
            This site describes the product — it is not investment advice and promises no return.{" "}
            <Link href="/risk" className="text-slate-300 underline-offset-4 hover:text-white hover:underline">
              Read the risk disclosure
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
