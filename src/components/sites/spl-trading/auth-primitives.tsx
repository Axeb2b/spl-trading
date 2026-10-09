"use client";

import { useId, useRef, useState } from "react";
import {
  BannerErrorIcon,
  BannerInfoIcon,
  BannerOkIcon,
  BannerWarnIcon,
  EyeIcon,
} from "./icons";

export function AuthField({
  label,
  value,
  type = "text",
  placeholder,
  disabled,
  error,
  hint,
  hintError,
  ok,
  autoComplete,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  hintError?: boolean;
  ok?: boolean;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  const errorText = error?.trim() ? error : "";

  return (
    <div className="auth-field">
      <label className="auth-field__label">{label}</label>
      <input
        value={value}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`auth-field__input${error ? " auth-field__input--error" : ""}${
          ok && !error ? " auth-field__input--ok" : ""
        }`}
        onChange={(event) => onChange(event.target.value)}
      />
      {errorText ? (
        <p className="auth-field__error">{errorText}</p>
      ) : hint ? (
        <p className={`auth-field__hint${hintError ? " auth-field__hint--error" : ""}`}>{hint}</p>
      ) : null}
    </div>
  );
}

export function AuthPasswordField({
  label,
  value,
  placeholder,
  disabled,
  error,
  invalid,
  hint,
  ok,
  autoComplete,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  invalid?: boolean;
  hint?: string;
  ok?: boolean;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const errorText = error?.trim() ? error : "";
  const hasError = Boolean(error || invalid);

  return (
    <div className="auth-field">
      <label className="auth-field__label">{label}</label>
      <div className="auth-field__password-wrap">
        <input
          value={value}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`auth-field__input auth-field__input--password${
            hasError ? " auth-field__input--error" : ""
          }${ok && !hasError ? " auth-field__input--ok" : ""}`}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="auth-field__eye"
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
        >
          <EyeIcon />
        </button>
      </div>
      {errorText ? (
        <p className="auth-field__error">{errorText}</p>
      ) : hint ? (
        <p className="auth-field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function AuthActions({
  primaryLabel,
  loadingLabel,
  secondaryLabel,
  loading,
  secondaryLoading,
  disabled,
  onPrimary,
  onSecondary,
}: {
  primaryLabel: string;
  loadingLabel?: string;
  secondaryLabel?: string;
  loading?: boolean;
  secondaryLoading?: boolean;
  disabled?: boolean;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  return (
    <div className="auth-actions">
      <button
        type="button"
        className={`auth-btn auth-btn--primary${loading ? " auth-btn--loading" : ""}${
          disabled || loading ? " auth-btn--disabled" : ""
        }`}
        disabled={disabled || loading}
        onClick={onPrimary}
      >
        {loading ? <span className="auth-btn__spinner" /> : null}
        <span>{loading && loadingLabel ? loadingLabel : primaryLabel}</span>
      </button>
      {secondaryLabel ? (
        <button
          type="button"
          className="auth-btn auth-btn--secondary"
          disabled={secondaryLoading}
          onClick={onSecondary}
        >
          {secondaryLoading ? <span className="auth-btn__spinner auth-btn__spinner--secondary" /> : null}
          <span>{secondaryLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

export type BannerKind = "error" | "warn" | "info" | "ok";

export function AuthBanner({
  kind,
  title,
  text,
}: {
  kind: BannerKind | null;
  title?: string;
  text?: string;
}) {
  if (!kind) return null;

  return (
    <div className={`auth-banner auth-banner--${kind}`}>
      <span className="auth-banner__icon" aria-hidden="true">
        {kind === "error" ? (
          <BannerErrorIcon />
        ) : kind === "warn" ? (
          <BannerWarnIcon />
        ) : kind === "info" ? (
          <BannerInfoIcon />
        ) : (
          <BannerOkIcon />
        )}
      </span>
      <div>
        {title ? <div className="auth-banner__title">{title}</div> : null}
        {text ? <div className="auth-banner__text">{text}</div> : null}
      </div>
    </div>
  );
}

export function OtpField({
  value,
  length = 6,
  disabled,
  error,
  onChange,
}: {
  value: string;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, digit: string) {
    const digits = value.padEnd(length, " ").split("");
    digits[index] = digit || " ";
    onChange(digits.join("").replace(/\s+$/, ""));
  }

  function handleInput(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = (value.slice(0, index) + digits).slice(0, length);
      onChange(next);
      inputs.current[Math.min(index + digits.length, length - 1)]?.focus();
      return;
    }
    setDigit(index, digits);
    if (digits) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !value[index]) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <div className={`auth-otp${error ? " auth-otp--error" : ""}`}>
      {Array.from({ length }, (_, index) => (
        <input
          key={`${id}-${index}`}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          className="auth-otp__input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          disabled={disabled}
          value={value[index] ?? ""}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
        />
      ))}
    </div>
  );
}
