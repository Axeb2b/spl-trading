/**
 * Relative time rendered against the SERVER clock (never the browser clock
 * during SSR — see `src/hooks/use-server-now.ts`).
 *
 * Units are `min`, `h`, `d`, `mo` — never `m`/`mins`.
 */
export type RelativeStyle = "short" | "long";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(n: number, unit: string, style: RelativeStyle): string {
  if (style === "long") {
    if (unit === "min") return n === 1 ? "a minute" : `${n} minutes`;
    if (unit === "h") return n === 1 ? "an hour" : `${n} hours`;
    if (unit === "d") return n === 1 ? "a day" : `${n} days`;
    return n === 1 ? "a month" : `${n} months`;
  }
  return `${n} ${unit}`;
}

export function relativeIst(iso: string, nowIso: string, style: RelativeStyle = "short"): string {
  const then = Date.parse(iso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(then) || Number.isNaN(now)) return "";

  const delta = then - now;
  const abs = Math.abs(delta);
  const future = delta > 0;

  if (abs < 45_000) return future ? "in a moment" : "just now";

  if (abs < 90_000) {
    const n = 1;
    return future ? `in ${plural(n, "min", style)}` : `${plural(n, "min", style)} ago`;
  }

  if (abs < 45 * MINUTE) {
    const n = Math.max(1, Math.round(abs / MINUTE));
    return future ? `in ${plural(n, "min", style)}` : `${plural(n, "min", style)} ago`;
  }

  if (abs < 90 * MINUTE) {
    const n = 1;
    return future ? `in ${plural(n, "h", style)}` : `${plural(n, "h", style)} ago`;
  }

  if (abs < 22 * HOUR) {
    const n = Math.max(1, Math.round(abs / HOUR));
    return future ? `in ${plural(n, "h", style)}` : `${plural(n, "h", style)} ago`;
  }

  if (abs < 36 * HOUR) {
    const n = 1;
    return future ? `in ${plural(n, "d", style)}` : `${plural(n, "d", style)} ago`;
  }

  if (abs < 30 * DAY) {
    const n = Math.max(1, Math.round(abs / DAY));
    return future ? `in ${plural(n, "d", style)}` : `${plural(n, "d", style)} ago`;
  }

  if (abs < 45 * DAY) {
    const n = 1;
    return future ? `in ${plural(n, "mo", style)}` : `${plural(n, "mo", style)} ago`;
  }

  if (abs < 320 * DAY) {
    const n = Math.max(1, Math.round(abs / (30 * DAY)));
    return future ? `in ${plural(n, "mo", style)}` : `${plural(n, "mo", style)} ago`;
  }

  // Too far away to be useful as a relative label — the caller falls back to
  // the absolute IST date.
  return "";
}
