/**
 * Asia/Kolkata (IST, UTC+05:30) — the product display timezone.
 *
 * IST is a fixed +05:30 offset with no DST, so every conversion is exact
 * arithmetic: no tzdata, no DST boundaries, no ambiguous local times.
 *
 * Storage and transport stay UTC (ISO-8601 with `Z`); only display is IST.
 */

export const IST_OFFSET_MINUTES = 330;
export const IST_OFFSET_MS = 19_800_000;
export const IST_TIME_ZONE = "Asia/Kolkata";
export const IST_OFFSET_LABEL = "+05:30";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type IstParts = {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday */
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  epochDay: number;
  /** `YYYY-MM-DD` in IST */
  dateKey: string;
};

export type IstStyle = "full" | "date" | "time" | "compact";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** `YYYY-MM-DD` → civil parts. Throws on a malformed key. */
function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new RangeError(`Invalid IST date key: ${dateKey}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function toMs(input: string | Date): number {
  if (input instanceof Date) return input.getTime();
  const ms = Date.parse(input);
  if (Number.isNaN(ms)) throw new RangeError(`Invalid date: ${input}`);
  return ms;
}

export function toIstParts(input: string | Date): IstParts {
  const ms = toMs(input);
  const shifted = new Date(ms + IST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  return {
    year,
    month,
    day,
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    weekday: shifted.getUTCDay() as IstParts["weekday"],
    epochDay: Math.floor((ms + IST_OFFSET_MS) / 86_400_000),
    dateKey: `${year}-${pad2(month)}-${pad2(day)}`,
  };
}

/** `YYYY-MM-DD` (IST) → UTC instant of 00:00:00.000 IST. */
export function istDayStartUtc(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS).toISOString();
}

/** `YYYY-MM-DD` (IST) → UTC instant of 23:59:59.999 IST. */
export function istDayEndUtc(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - IST_OFFSET_MS).toISOString();
}

/** Inclusive IST calendar-day range → UTC instants. */
export function istDayRange(
  fromKey: string,
  toKey: string,
): { fromUtc: string; toUtc: string; fromKey: string; toKey: string; days: number } {
  const from = toIstParts(istDayStartUtc(fromKey));
  const to = toIstParts(istDayStartUtc(toKey));
  return {
    fromUtc: istDayStartUtc(fromKey),
    toUtc: istDayEndUtc(toKey),
    fromKey,
    toKey,
    days: to.epochDay - from.epochDay + 1,
  };
}

export function addIstDays(dateKey: string, days: number): string {
  const { year, month, day } = parseDateKey(dateKey);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * 86_400_000 + IST_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

export function istTodayKey(nowIso: string): string {
  return toIstParts(nowIso).dateKey;
}

export function istDateKey(input: string | Date): string {
  return toIstParts(input).dateKey;
}

/**
 * `full`    → `21 Oct 2026, 14:07 IST`
 * `date`    → `21 Oct 2026`
 * `time`    → `14:07 IST`
 * `compact` → `21 Oct 2026, 14:07` — internal only, never user-facing.
 */
export function formatIst(input: string | Date, style: IstStyle = "full"): string {
  const p = toIstParts(input);
  const date = `${p.day} ${MONTHS[p.month - 1]} ${p.year}`;
  const time = `${pad2(p.hour)}:${pad2(p.minute)}`;
  switch (style) {
    case "date":
      return date;
    case "time":
      return `${time} IST`;
    case "compact":
      return `${date}, ${time}`;
    case "full":
    default:
      return `${date}, ${time} IST`;
  }
}

/** `01 Oct 2026 – 21 Oct 2026 (IST)` */
export function istRangeLabel(fromKey: string, toKey: string): string {
  const from = toIstParts(istDayStartUtc(fromKey));
  const to = toIstParts(istDayStartUtc(toKey));
  const left = `${from.day} ${MONTHS[from.month - 1]} ${from.year}`;
  const right = `${to.day} ${MONTHS[to.month - 1]} ${to.year}`;
  return `${left} – ${right} (IST)`;
}

/** `Expires in 14 min` / `Expired 17 min ago` */
export function formatCountdown(targetIso: string, nowIso: string): string {
  const deltaMs = toMs(targetIso) - toMs(nowIso);
  const abs = Math.abs(deltaMs);
  const mins = Math.floor(abs / 60_000);
  if (mins < 1) return deltaMs >= 0 ? "Expires in under a minute" : "Expired";
  if (mins < 60) return deltaMs >= 0 ? `Expires in ${mins} min` : `Expired ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  const restMin = mins % 60;
  if (hours < 24) {
    return deltaMs >= 0
      ? `Expires in ${hours} h${restMin ? ` ${restMin} min` : ""}`
      : `Expired ${hours} h${restMin ? ` ${restMin} min` : ""} ago`;
  }
  const days = Math.floor(hours / 24);
  return deltaMs >= 0 ? `Expires in ${days} d` : `Expired ${days} d ago`;
}
