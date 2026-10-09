import type { ReactNode } from "react";
import Link from "next/link";
import "./auth.css";
import { AsideIcon, type AsideIconName } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export type AsideItem = {
  text: string;
  icon: AsideIconName;
};

const DEFAULT_ASIDE_ITEMS: AsideItem[] = [
  { text: "Crypto and bank settlements", icon: "check" },
  { text: "Commission on every payout you cover", icon: "check" },
  { text: "Support in your own Telegram group", icon: "check" },
];

type AuthShellProps = {
  title: string;
  subtitle?: string;
  asideTitle: string;
  asideText: string;
  asideItems?: AsideItem[];
  step?: number;
  stepLabels?: string[];
  headLinkText?: string;
  headLinkCta?: string;
  headLinkTo?: string;
  footText?: string;
  footCta?: string;
  footLinkTo?: string;
  footMobileOnly?: boolean;
  hideFoot?: boolean;
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  asideTitle,
  asideText,
  asideItems,
  step,
  stepLabels,
  headLinkText,
  headLinkCta,
  headLinkTo,
  footText,
  footCta,
  footLinkTo,
  footMobileOnly,
  hideFoot,
  children,
}: AuthShellProps) {
  const items = asideItems?.length ? asideItems : DEFAULT_ASIDE_ITEMS;

  return (
    <div className="auth-layout">
      <div className="auth-shell">
        <div className="auth-shell__card">
          <aside className="auth-shell__aside">
            <div>
              <div className="auth-shell__aside-title">{asideTitle}</div>
              <div className="auth-shell__aside-text">{asideText}</div>
            </div>
            <ul className="auth-shell__aside-list">
              {items.map((item) => (
                <li key={item.text}>
                  <span className="auth-shell__aside-icon" aria-hidden="true">
                    <AsideIcon name={item.icon} />
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </aside>
          <div className="auth-shell__form">
            <div className="auth-shell__head">
              <div>
                <h1 className="auth-shell__title">{title}</h1>
                {subtitle ? <p className="auth-shell__subtitle">{subtitle}</p> : null}
              </div>
              <div className="auth-shell__head-actions">
                {headLinkText ? (
                  <p className="auth-shell__head-link auth-shell__head-link--desktop">
                    {headLinkText}{" "}
                    <Link href={headLinkTo ?? "/"}>{headLinkCta}</Link>
                  </p>
                ) : null}
                <ThemeToggle />
              </div>
            </div>
            {step ? (
              <AuthStepProgress step={step} labels={stepLabels ?? ["Your details", "Telegram"]} />
            ) : null}
            {children}
            {footText && !hideFoot ? (
              <p
                className={
                  footMobileOnly
                    ? "auth-shell__foot auth-shell__foot--mobile-only"
                    : "auth-shell__foot"
                }
              >
                {footText}{" "}
                <Link href={footLinkTo ?? "/"}>{footCta}</Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthStepProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="auth-steps">
      {labels.map((label, index) => (
        <div
          key={label}
          className={`auth-steps__item${step >= index + 1 ? " auth-steps__item--active" : ""}${
            step > index + 1 ? " auth-steps__item--done" : ""
          }`}
        >
          <div className="auth-steps__track" />
          <div className="auth-steps__label">{label}</div>
        </div>
      ))}
    </div>
  );
}
