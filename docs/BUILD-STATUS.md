# Build Status — SPL TRADING

Running implementation log for the production upgrade. Newest entry first per slice.

Legend: `[x]` done · `[~]` in progress · `[ ]` not started · `⚠️` blocked on external input

---

## Slice 0 — UI Foundation & Design System — `[~]` in progress

**Date:** 2026-10-10

### Added
- `npx shadcn add` pulled 9 primitives (Base UI-based, matching the existing `button.tsx`):
  `badge`, `dialog`, `dropdown-menu`, `popover`, `select`, `skeleton`, `sonner`, `table`, `tabs`
  - Registry emitted a broken alias (`import { cn } from "cn"`) in 7 files — rewritten to `@/lib/utils`
  - Installed deps: `sonner`, `next-themes`
- SPL-specific components in `src/components/ui/`:
  - `status-pill.tsx` — status badge + `depositStatus()` / `withdrawalStatus()` tone mappers
  - `money-input.tsx` — amount input with currency select and live min/max validation
  - `copy-button.tsx` — icon + button variants with copied state
  - `countdown.tsx` — live expiry countdown (warns under 5 min, red when expired)
  - `stat-card.tsx` — `StatCard` + responsive `StatCardGrid`
  - `empty-state.tsx` — icon/title/description/action empty state
  - `qr-panel.tsx` — QR + address + network warning + reference + countdown (extracted from deposit dialog)
  - `app-toaster.tsx` — sonner host bound to the SPL theme
- `docs/BUILD-STATUS.md` — this log

### Changed
- `src/app/layout.tsx` — mounts `ThemeApplier` (was auth-pages only) and `AppToaster`
- `src/app/globals.css` — dark-mode surface mapping for the captured cabinet markup (`.bg-white`, `.text-slate-*`, `.border-*`, header/navbar/banner). The cloned stylesheet has literal colors, so variants can't reach it; this layer remaps the utilities the cabinet actually uses.
- `theme-toggle.tsx` — one toggle now syncs **both** `data-auth-theme` (captured CSS) and `.dark` (shadcn kit); exports `useAuthTheme()`; `ThemeToggle` accepts `className`
- `cabinet-shell.tsx` — header now has a dark-mode toggle
- `sign-up-flow.tsx` — **452 → 142 lines and now functional** (see below)
- `auth-shell.tsx` — dropped duplicate `ThemeApplier` (layout owns it)
- `auth/sign-up/page.tsx` — no longer passes the dead `step` param
- `deposit-dialog.tsx` — 218 → 137 lines, now uses `MoneyInput` + `QrPanel` instead of duplicated inline QR code
- `list-views.tsx` — **deleted, split into** `view-primitives.tsx` (Toolbar/EmptyTable/SelectField/DateField) + `payins-view.tsx`, `payouts-view.tsx`, `accounts-view.tsx`, `report-view.tsx`
- `loading.tsx` added for `/`, `/payins`, `/payouts`, `/accounts`, `/report`, `/onboarding`, `/admin` via `cabinet-skeleton.tsx`

### Sign-up: dead UI → working registration
The captured 3-step wizard (details → Telegram → email code) sent nothing — `sign-up-flow.tsx:31`
said so explicitly. Steps 2–3 require an email provider and a Telegram auth backend that don't
exist, so keeping them would be a fake flow. Replaced with a single real form posting to
`/api/v1/auth/register` (name, email, password, confirm, optional referral code).

⚠️ **Known gap:** email verification and Telegram linking are not implemented (no provider).
Accounts are usable immediately after registration. Reinstate the 3-step wizard once a mail
provider and Telegram auth exist.

### Verification
```
npm run check        → PASS (lint + typecheck + build, 28 routes)
```
Live smoke against `npm run dev`:
- register with referral code → `{"success":true,"userId":"f53103ea…"}`
- duplicate email → `409`
- password < 8 chars → `400 {"error":"Password must be at least 8 characters."}`
- `referred_by` persisted → `slice0@test.dev` → admin id (referral attribution works)
- `/auth/sign-up` renders "Create your account / Full name / Referral code"

### Remaining in Slice 0
- [ ] QR decode round-trip test (needs `jsqr` + `pngjs`) — scheduled in Slice 1
- [ ] Dashboard chart work (recharts) — Slice 4
- [ ] Real notification center (bell popover + `/notifications`) — Slice 6
- [ ] `/referrals` page — Slice 5
- [ ] Reduced-motion + keyboard/focus pass — Slice 9

---

## Foundation (previous session)

`[x]` SQLite (`node:sqlite`) double-entry ledger with idempotency keys, integer cents
`[x]` Local auth (scrypt) + legacy sutra-reg proxy fallback; session carries `userId`/`role`
`[x]` Deposit / withdrawal / referral services with state machines
`[x]` `/api/v1/*` routes (me, dashboard/summary, deposits, withdrawals, referrals, transactions, admin/*)
`[x]` BEP-20 address config + server-side QR generation
`[x]` Feature flags gated behind `SPL_LIVE_MODE` (all money movement OFF)
`[x]` Seeded demo admin via `npm run seed:admin`
`[x]` Binance webhook stub returns 503 (no merchant configured)

---

## Blockers (external input required)

| Item | Blocks | Status |
|---|---|---|
| Real BEP-20 receiving address | live deposits | ⚠️ dummy `0x8ba1…` configured |
| `TELEGRAM_BOT_TOKEN` + admin IDs | Slices 6–7 | ⚠️ not provided |
| `BSCSCAN_API_KEY` | Slice 3 verification | ⚠️ optional, rate-limited without |
| Email provider | email verification | ⚠️ not implemented |
| `SPL_LIVE_MODE=1` | all money movement | OFF by design |