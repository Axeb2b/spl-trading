# Timezone & realtime

The product timezone is **Asia/Kolkata (IST, UTC+05:30)**. IST is a fixed offset with no DST, so
every conversion is exact arithmetic — no tzdata, no DST boundaries, no ambiguous local times.

## Rules

1. **Storage** — ISO-8601 UTC with milliseconds and `Z` (`2026-10-21T08:37:12.482Z`). Every
   column in the schema defaults to `strftime('%Y-%m-%dT%H:%M:%fZ','now')`.
2. **Display** — Asia/Kolkata. Every user-facing timestamp carries the literal `IST` suffix.
3. **Day boundaries** — IST calendar days (00:00:00.000 – 23:59:59.999 IST) for report ranges,
   date filters, daily aggregates and any exported filename. The client submits an IST date key
   (`YYYY-MM-DD`); the server owns the UTC conversion.
4. **Rolling windows** — "last 24 h" / "last 7 days" are rolling instants, UTC-anchored, and are
   labelled as rolling so they are never confused with a calendar day.

## Library — `src/lib/time/ist.ts`

| Function | Purpose |
|---|---|
| `toIstParts(input)` | civil IST fields + `dateKey` (`YYYY-MM-DD`) |
| `istDayStartUtc(key)` / `istDayEndUtc(key)` | UTC instants of an IST day |
| `istDayRange(from, to)` | inclusive range → UTC instants + day count |
| `addIstDays(key, n)` | IST calendar arithmetic |
| `istTodayKey(nowIso)` | today's IST date key |
| `formatIst(input, style)` | `full` → `21 Oct 2026, 14:07 IST`; also `date`, `time`, `compact` |
| `istRangeLabel(from, to)` | `01 Oct 2026 – 21 Oct 2026 (IST)` |
| `formatCountdown(target, now)` | `Expires in 14 min` |

`compact` is internal only — user-facing output is always `full` or `date`, always suffixed.

`src/lib/format.ts` exposes `formatDate()` (absolute IST) and `formatDateOnly()`. Nothing formats
a date with `toLocaleString` any more: the old implementation rendered in the *server's* zone
(UTC on Workers) with no offset and no suffix, so every timestamp in the cabinet was ambiguous.

`scripts/check-spl-style.mjs` fails the build if a `toLocaleString` date format reappears.

## Relative time — `src/lib/time/relative.ts`

| Δ | Past | Future |
|---|---|---|
| 0–44 s | `just now` | `in a moment` |
| 45–89 s | `1 min ago` | `in 1 min` |
| 90 s–44 min | `N min ago` | `in N min` |
| 45–89 min | `1 h ago` | `in 1 h` |
| 90 min–21 h | `N h ago` | `in N h` |
| 22–35 h | `1 d ago` | `in 1 d` |
| 36 h–29 d | `N d ago` | `in N d` |
| 30–44 d | `1 mo ago` | `in 1 mo` |
| 45–319 d | `N mo ago` | `in N mo` |
| ≥ 320 d | absolute date | absolute date |

Units are `min`, `h`, `d`, `mo` — never `m`/`mins`.

### Hydration safety

The server never emits a relative string. The first client render is identical to the SSR output;
relative labels appear only after mount, when `useServerNow()` anchors the client to the server
clock (the device clock is only a tick source, so a wrong device clock cannot show wrong
"5 min ago").

## Realtime transport

`GET /api/v1/stream` — one multiplexed Server-Sent Events stream per client.

```
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
```

| Event | Payload | Trigger |
|---|---|---|
| `hello` | `{ serverNow, tz, userId }` | connect |
| `heartbeat` | `{ serverNow }` | every 25 s |
| `deposit.updated` | `{ id, status }` | deposit created, credited or rejected |
| `withdrawal.updated` | `{ id, status }` | payout requested, approved, processing, paid or rejected |
| `transaction.created` | `{ id, kind, amountCents }` | new ledger row |
| `onboarding.updated` | `{ completedCount, total, currentStepId }` | setup progress changed |
| `overview.updated` | `{ reason }` | balances/counters may have changed → refetch |
| `admin.queue.updated` | `{ pendingDeposits, pendingWithdrawals }` | admin channel |

The client resumes with `Last-Event-ID`; the server sends `retry: 3000` on connect. The handler
tails the `events` table once per second and recycles the stream every 55 s to stay inside the
Worker CPU budget.

Events are written by the mutation handlers themselves (`/api/v1/deposits`, `/api/v1/withdrawals`,
and the two admin review routes), so a state change and its announcement cannot drift apart.

## Client state machine — `src/hooks/use-realtime.ts`

| State | Meaning | Indicator |
|---|---|---|
| `connecting` | stream opening | grey dot, "Connecting" |
| `live` | stream open, heartbeats arriving | green pulsing dot, "Live" |
| `reconnecting` | dropped; backoff 1 → 2 → 4 → 8 → 15 s with jitter | grey dot |
| `polling` | 3 consecutive failures — SSE abandoned for 60 s, 30 s polling fallback | amber dot |
| `offline` | browser reports no network | red dot, "Offline" |

- A stream that sends no heartbeat for 45 s is treated as dead.
- A backgrounded tab keeps the stream open; on `visibilitychange → visible` every mounted panel
  revalidates immediately, so nothing is missed while hidden.
- On reconnect the client revalidates, so a gap in the event log can never leave stale rows on
  screen.
- The header indicator reports the real transport state — the previous build showed a static
  "Online" pill that meant nothing.

## Housekeeping

The deployed worker has no custom entry point, so a `scheduled` handler would mean changing the
deploy pipeline. Instead the stream handler prunes `events` older than 24 h and expired `sessions`
at most once per minute per isolate. If the worker ever gains a custom entry, move this to a
cron trigger and delete the inline pruning.
