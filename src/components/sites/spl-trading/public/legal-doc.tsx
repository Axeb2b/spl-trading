import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { PublicPageIntro } from "./public-shell";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Escape hatch for links or notes that need markup. */
  extra?: ReactNode;
};

type LegalDocProps = {
  eyebrow: string;
  title: string;
  lede: string;
  revised: string;
  sections: LegalSection[];
};

export function LegalDoc({ eyebrow, title, lede, revised, sections }: LegalDocProps) {
  return (
    <>
      <PublicPageIntro eyebrow={eyebrow} title={title} lede={lede} />

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:gap-16">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {sections.map((section, index) => (
              <section key={section.heading} id={`section-${index + 1}`} className="py-7 first:pt-0 scroll-mt-28">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50">
                  {section.heading}
                </h2>

                {section.paragraphs?.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${section.heading}-p${paragraphIndex}`}
                    className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-3">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li
                        key={`${section.heading}-b${bulletIndex}`}
                        className="flex max-w-3xl gap-3 text-sm leading-6 text-slate-600 dark:text-slate-400"
                      >
                        <span
                          aria-hidden
                          className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.extra ? <div className="mt-4">{section.extra}</div> : null}
              </section>
            ))}
          </div>
        </div>

        <aside className="order-1 self-start lg:order-2 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.025] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <CalendarDays className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden />
              Document details
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Last revised</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{revised}</p>
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                This page is provided for information. It does not replace professional legal, tax, or financial advice.
              </p>
            </div>
          </div>

          <nav aria-label="On this page" className="mt-5 hidden lg:block">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              On this page
            </p>
            <ol className="space-y-1">
              {sections.map((section, index) => (
                <li key={section.heading}>
                  <a
                    href={`#section-${index + 1}`}
                    className="block rounded-lg px-2 py-1.5 text-xs leading-5 text-slate-500 transition hover:bg-white hover:text-emerald-800 dark:hover:bg-slate-900 dark:hover:text-emerald-300"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </>
  );
}
