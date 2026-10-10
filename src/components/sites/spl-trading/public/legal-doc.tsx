import type { ReactNode } from "react";
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

      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
          Last revised {revised}
        </p>

        <div className="mt-8 divide-y divide-slate-200 dark:divide-slate-800">
          {sections.map((section) => (
            <section key={section.heading} className="py-7 first:pt-0">
              <h2 className="text-lg font-semibold tracking-[-0.01em] text-slate-900 dark:text-slate-50">
                {section.heading}
              </h2>

              {section.paragraphs?.map((paragraph, index) => (
                <p
                  key={`${section.heading}-p${index}`}
                  className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets?.length ? (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((bullet, index) => (
                    <li
                      key={`${section.heading}-b${index}`}
                      className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                    >
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-500"
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
    </>
  );
}
