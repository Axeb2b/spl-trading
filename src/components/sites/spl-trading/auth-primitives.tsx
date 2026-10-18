"use client";

import { useId, useRef, useState } from "react";
import {
  BannerErrorIcon,
  BannerInfoIcon,
  BannerOkIcon,
  BannerWarnIcon,
  EyeIcon,
} from "./icons";

const INPUT_BASE =
  "h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900";
const INPUT_IDLE =
  "border-slate-200 focus:border-emerald-700 focus-visible:ring-emerald-700/15 dark:border-slate-700 dark:focus:border-emerald-400 dark:focus-visible:ring-emerald-400/15";
const INPUT_ERROR =
  "border-red-300 focus:border-red-500 focus-visible:ring-red-500/15 dark:border-red-800 dark:focus:border-red-500";
const INPUT_OK =
  "border-emerald-400 focus:border-emerald-600 focus-visible:ring-emerald-600/15 dark:border-emerald-700";

const LABEL = "text-sm font-semibold text-slate-800 dark:text-slate-200";

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
  const id = useId();
  const errorText = error?.trim() ? error : "";
  const state = errorText ? INPUT_ERROR : ok ? INPUT_OK : INPUT_IDLE;
  const descriptionId = errorText ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label className={LABEL} htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={descriptionId}
        className={`${INPUT_BASE} ${state}`}
        onChange={(event) => onChange(event.target.value)}
      />
      {errorText ? (
        <p id={`${id}-error`} className="text-xs font-medium text-red-700 dark:text-red-300">{errorText}</p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className={`text-xs leading-5 ${
            hintError ? "text-red-700 dark:text-red-300" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {hint}
        </p>
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
  const id = useId();
  const errorText = error?.trim() ? error : "";
  const hasError = Boolean(errorText || invalid);
  const state = hasError ? INPUT_ERROR : ok ? INPUT_OK : INPUT_IDLE;
  const descriptionId = errorText ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label className={LABEL} htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          value={value}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={descriptionId}
          className={`${INPUT_BASE} ${state} pr-12`}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <EyeIcon />
        </button>
      </div>
      {errorText ? (
        <p id={`${id}-error`} className="text-xs font-medium text-red-700 dark:text-red-300">{errorText}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p>
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
  onSecondary,
}: {
  primaryLabel: string;
  loadingLabel?: string;
  secondaryLabel?: string;
  loading?: boolean;
  secondaryLoading?: boolean;
  disabled?: boolean;
  onSecondary?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <button
        type="submit"
        disabled={disabled || loading}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800/30 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-lime-300 dark:text-emerald-950 dark:hover:bg-lime-200"
      >
        {loading ? <Spinner /> : null}
        <span>{loading && loadingLabel ? loadingLabel : primaryLabel}</span>
      </button>

      {secondaryLabel ? (
        <button
          type="button"
          disabled={secondaryLoading}
          onClick={onSecondary}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-800/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {secondaryLoading ? <Spinner /> : null}
          <span>{secondaryLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}

export type BannerKind = "error" | "warn" | "info" | "ok";

const BANNER_STYLE: Record<BannerKind, string> = {
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  warn: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

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
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`mb-5 flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm ${BANNER_STYLE[kind]}`}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
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
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {text ? <p className="mt-0.5 opacity-90">{text}</p> : null}
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
    <div className="flex gap-2">
      {Array.from({ length }, (_, index) => (
        <input
          key={`${id}-${index}`}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          disabled={disabled}
          value={value[index] ?? ""}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={error ? true : undefined}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={`h-12 w-full min-w-0 rounded-lg border bg-white text-center text-lg font-medium text-slate-900 outline-none transition focus:ring-2 disabled:opacity-60 dark:bg-slate-900 dark:text-slate-50 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-500/10 dark:border-red-800"
              : "border-slate-200 focus:border-slate-400 focus:ring-slate-900/5 dark:border-slate-700 dark:focus:border-slate-500"
          }`}
        />
      ))}
    </div>
  );
}
