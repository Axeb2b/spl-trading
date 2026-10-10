# SPL Trading — Website Analysis

**Target:** https://sutra-reg.org (originally cloned from sutra-reg.org in Oct 2026; now evolving on its own design system)
**Repo:** ai-website-clone-template — branch `cline/qvgeg8wj` (analysis snapshot: 2026-10-10)
**Status:** `npm run lint` PASS, `npm run typecheck` PASS. `npm run build` in progress (slow — Next.js 16 + webpack on a 24-CPU Termux box).

---

## 1. What this site is

SPL Trading is a **trading-cabinet SaaS** for USDT (BEP-20 / TRC20) deposits and payouts. Its public marketing pages describe the service; logged-in users get a personal **cabinet** dashboard to:

- See balances and portfolio statistics
- Create deposit orders, receive a live QR code + receiving address, wait for confirmation
- Request payouts to saved bank/e-wallet accounts, track them through pending → approved → processing → completed
- Manage payout accounts and bank groups
- Read a full ledger/report of deposits, withdrawals, and the double-entry postings behind them
- Complete an onboarding checklist (Telegram link, first deposit, payout account)
- Earn referral rewards

Operators run a separate **admin console** (platform overview, deposit orders, withdrawal requests, config/feature flags).

The app uses **local credential auth** (scrypt password hashes, HMAC-signed `spl_session` cookie) plus a SQLite data layer that **dual-boots**: `node:sqlite` (local dev/test/build) and **Cloudflare D1** (production).

### Key architectural notes

- **Auth:** `src/lib/session.ts` signs/verifies the HMAC `spl_session` cookie. `src/proxy.ts` is the Next.js 16 route guard (middleware deprecated — `proxy.ts` is the new pattern). It redirects anonymous users from protected routes (`/payins`, `/payouts`, `/accounts`, `/onboarding`, `/report`, `/admin`) to `/auth/sign-in`, and sends signed-in users away from `/auth/*`.
- **Money movement is OFF by default.** Every feature flag in `src/lib/flags.ts` (`deposits_enabled`, `withdrawals_enabled`, `referrals_enabled`, `investments_enabled`) evaluates to `false` unless `SPL_LIVE_MODE=1`. This is intentional — money-movement endpoints return 403 while `SPL_LIVE_MODE=0`.
- **Auth proxying:** the local `/api/auth/login` proxies to the live sutra-reg.org `POST /api/auth/login` endpoint (sets the live JWT). Local user creation goes to `/api/v1/auth/register` into the local DB (demo seed admin via `npm run seed:admin`).

---

## 2. Route map (28 routes; `npm run check` gate)

| Route | Protected | Description |
|---|---|---|
| `/` | gated by session | Guests → **Landing** (`components/sites/spl-trading/public/landing.tsx`). Signed-in users → **Cabinet dashboard** (`DashboardCards`, `HomeStats`) |
| `/fees` | public | Published withdrawal fee (1.00%), min/max deposits, min payout, order expiry |
| `/contact` | public | Contact info (in-app support, Telegram) |
| `/support` | public | Help / what to include in a support request |
| `/privacy` | public | Policy (no third-party analytics — explicitly stated) |
| `/terms` | public | Terms of service |
| `/risk` | public | Risk disclosure — no promised returns, volatile assets, features can be disabled |
| `/onboarding` | protected | 12-step setup checklist |
| `/auth/sign-in` | public (redirects away if signed in) | Sign-in form |
| `/auth/sign-up` | public | Registration form (single real step: name, email, password, confirm, optional referral code) |
| `/auth/forgot-password` | public | Password reset |
| `/payins` | protected | Deposit orders table |
| `/payouts` | protected | Withdrawal requests table |
| `/accounts` | protected | Payout accounts & bank groups |
| `/report` | protected | Ledger/report view |
| `/admin` | protected | Admin console stub (staff-only) |

### API routes (`src/app/api/v1/*`)

| Route | Purpose |
|---|---|
| `POST /api/auth/login` | Proxies to live sutra-reg.org login; sets `spl_session` |
| `POST /api/auth/logout` | Clears `spl_session` |
| `POST /api/v1/auth/register` | Local registration with referral attribution; 409 on duplicate email, 400 on weak password |
| `GET /api/v1/me` | Current user profile |
| `GET /api/v1/dashboard/summary` | Balance summary, counts, notifications |
| `GET/POST /api/v1/deposits` | Create/list deposit orders; min/max validation; server-side QR generation |
| `GET/POST /api/v1/withdrawals` | Create/list withdrawals; fee config |
| `GET/POST /api/v1/accounts` | Payout accounts & bank groups |
| `GET /api/v1/referrals` | Referral program data |
| `GET/POST /api/v1/transactions` | Ledger transactions + entries |
| `POST /api/v1/webhooks/binance` | Binance Pay merchant stub → 503 (no merchant configured) |
| `GET/POST /api/v1/admin/*` | Admin endpoints: platform overview, deposit orders, withdrawal requests, feature flags |


---

## 3. Data layer

**Dual-mode driver** (`src/lib/db.ts`):
- Production: D1 binding `process.env.DB` via OpenNext's `getCloudflareContext()` — no filesystem, no self-migration.
- Local: `node:sqlite` at `data/spl.sqlite` (`SPL_DB_PATH` / `SPL_DATA_DIR` overridable); applies migrations automatically on first use.

**Migrations** (`src/lib/migrations/`):
1. `001_init.sql` — full schema (users, ledger_transactions, ledger_entries, deposit_orders, withdrawal_requests, referral_rewards, platform_config, audit_logs) with index support. All monetary amounts are **integer cents** to avoid floating-point drift.
2. `002_referral_rewards_unique.sql` — enforce uniqueness on referral reward records.

**Ledger** (`src/lib/ledger.ts`): double-entry style. Every transaction posts balanced debit + credit entries into `ledger_entries`; account types: `asset_binance`, `liability_user_cash`, `revenue_fee`, `equity_retained_earnings`, `suspense_unmatched`. `getUserCashBalanceCents()` sums user cash liability.

**Feature flags** (`src/lib/flags.ts`): platform_config table driven; defaults off. Config numbers: `deposit_min_cents` (500.00), `deposit_max_cents` (10,000.00), `withdrawal_fee_bps` (100), `bep20_deposit_address`.

---

## 4. Money-movement state machines

**Deposits** (`src/lib/deposits.ts`): `pending` → `awaiting_payment` → `confirming` → `credited` / `expired` / `rejected`. `creditVerifiedDeposit()` claims the order atomically (conditional UPDATE on `status IN (...)`) and posts the ledger entry in one batch; losers see `changes === 0` and report `alreadyCredited`. 30-minute expiry.

**Withdrawals** (`src/lib/withdrawals.ts`, `src/lib/withdrawal-create.ts`, `src/lib/withdrawal-view.ts`): `pending` → `approved` → `processing` → `completed` / `rejected` / `failed`. Fee = 1% (`100 bps`), net = requested − fee. Admin review flow via `/api/v1/admin/withdrawals`.

---

## 5. UI / styling

- **Design system** (`src/components/ui/*`): `badge`, `status-pill.tsx` (deposit/withdrawal status tone mappers), `money-input.tsx` (amount + currency with live min/max), `copy-button.tsx`, `countdown.tsx` (warns under 5 min, red when expired), `stat-card.tsx`/`StatCardGrid`, `empty-state.tsx`, `qr-panel.tsx`, `app-toaster.tsx` (sonner). Base UI-based shadcn primitives: `badge`, `dialog`, `dropdown-menu`, `popover`, `select`, `skeleton`, `sonner`, `table`, `tabs`.
- **Cabinet**: `CabinetShell` (sidebar header, user menu), `dashboard-cards.tsx`, `home-stats.tsx`, `payins-view.tsx`, `payouts-view.tsx`, `accounts-view.tsx`, `report-view.tsx`, `onboarding-view.tsx`, `primeicons.C6QP2o4f.woff2`, `cabinet.css` (captured PrimeReact markup; `p-*` classes retained but components no longer depend on them after the deliberate visual redesign per HANDOFF.md).
- **Public**: `PublicShell`, `public-links.tsx`, `legal-doc.tsx`, `landing.tsx` (hero + how-it-works + features + CTA), auth pages (`sign-in-form.tsx`, `sign-up-flow.tsx`, `auth-shell.tsx`, `theme-toggle.tsx`, `icons.tsx`, `forgot-password-form.tsx`).
- **Tailwind CSS v4** with oklch design tokens. Dark mode via `next-themes` + `ThemeApplier` (layout-level).
- **Deviation from pixel-faithful clone (deliberate):** per HANDOFF.md §1, the user chose a **full visual redesign** over the "no personal aesthetic changes" rule; the cabinet UI now uses the project's own design system instead of the captured PrimeReact markup.

---

## 6. Build / dev status

- `npm run lint` → **PASS**
- `npm run typecheck` → **PASS** (strict mode, no `any`)
- `npm run build` → **IN PROGRESS** (webpack build is slow on this host; timeout was hit under `npm run check`, but individual lint/typecheck pass). The build produces `.next/standalone/` (~37 MB pruned server bundle — VPS Option B).
- `npm run seed:admin` → seeds the admin user into `data/spl.sqlite`.

---

## 7. Deployment status

**Cloudflare Workers (intended target):** configured via `@opennextjs/cloudflare` + `wrangler` (`wrangler.jsonc`: name `spl-trading`, D1 binding `DB`, DO queue `NEXT_CACHE_DO_QUEUE`, static assets at `.open-next/assets`). **NOT yet live.** The incremental cache is intentionally the "dummy" (no-op) variant to stay free-tier/no-credit-card eligible (R2 requires a payment method + $5 hold); the app is almost entirely dynamic/auth-gated pages, so ISR is unnecessary.

**Remaining deploy prerequisites:**
1. Cloudflare account with Workers + D1 enabled.
2. `CLOUDFLARE_ACCOUNT_ID` (+ API token) available to the deploy target.
3. D1 database provisioned (`npx wrangler d1 create spl`) and its `database_id` inserted into `wrangler.jsonc` (currently placeholder `REPLACE_WITH_D1_DATABASE_ID`).
4. Schema applied to D1 via `npx wrangler d1 migrations apply spl --remote` (run by CI `deploy.yml` before deploy).
5. `SPL_SESSION_SECRET` set in production (defaults to a dev value — must be rotated).

**Deployment paths:**
- **Preferred:** Cloudflare Workers Builds — git-connected CI, auto-builds on push, no secrets required.
- **Fallback (this repo):** `.github/workflows/deploy.yml` — gated behind a `probe-secrets` job that emits `enabled=false` when secrets are missing, so the `deploy` job is *skipped, not failed*. Currently no secrets configured.
- **Verified alternative:** VPS deploy (`docs/deploy/vps-setup.md`) using the SQLite file backend as-is, shipped via `.next/standalone` + pm2 + nginx + certbot. This is the self-contained path that works with zero Cloudflare setup.

**Rollback:** revert the offending git commit (Workers Builds redeploy), or promote a previous Cloudflare version from the dashboard.
**Referrals** (`src/lib/referrals.ts`, `/api/v1/referrals`): `pending` → `approved` → `paid` / `reversed`. Reward paid only after a qualifying credited deposit + approval.
---

## 8. Known gaps & blockers

| Item | Blocks | Status |
|---|---|---|
| Real BEP-20 receiving address | Live deposits | ⚠️ dummy `0x8ba1...` configured |
| `SPL_LIVE_MODE=1` | All money movement | OFF by design (production-ready behind flag) |
| `TELEGRAM_BOT_TOKEN` + admin IDs | Slices 6–7 (notification center, Telegram) | ⚠️ not provided |
| `BSCSCAN_API_KEY` | Slice 3 on-chain verification | ⚠️ optional, rate-limited |
| Email provider | Email verification flow | Not implemented (accounts usable immediately after registration) |
| D1 database + migration | Cloudflare deploy | Config in progress |
| Cloudflare secrets | Workers Builds deploy | Config in progress |
| `/referrals` page | Slice 5 | Planned |
| Dashboard chart work (recharts) | Slice 4 | Planned |
| Real notification center (bell popover) | Slice 6 | Planned |
| Desktop drawer nav wiring | Polish | Planned |
| Real pagination/filter logic | Cabinet list views | Currently static empty states |
| `/admin` real admin | Slice 2 | Stub — real admin lives on a separate host (`moospage.com/users`); stub is honest about this |

**Security notes:**
- Credentials never committed — env/shell only. Max 2 login attempts on the live proxy (3rd → 15-min lockout, HTTP 429).
- `.env`, `.env.local`, `.dev.vars*` are gitignored. `.env.example` and docs contain placeholders only.
- Session secret must be rotated in production (`SPL_SESSION_SECRET`).

---

## 9. How to run locally

```bash
npm ci
cp .env.example .env.local
export SPL_SESSION_SECRET=$(openssl rand -hex 32)
npm run seed:admin
npm run dev
```

Login with the owner's real credentials (stored in shell/env only — never written to repo).

---

## 10. Deviations from the original target

1. **Visual redesign** — own design system replaces captured PrimeReact markup (deliberate, per HANDOFF.md).
2. **Registration** — captured 3-step wizard (details → Telegram → email code) sent nowhere; replaced with a single real `/api/v1/auth/register` form.
3. **Deposit flow** — deposit dialog marked "Demo deposit. No request is created." unless money movement is enabled.
4. **Admin console** — stub (`/admin`) instead of `moospage.com/users`.
5. **No third-party analytics** — site explicitly publishes no tracking scripts.

---


---

## 11. Deployment (live, completed 2026-10-10)

**Target:** Cloudflare Workers (`spl-trading`, name in `wrangler.jsonc`)

**Status: LIVE** — deployed and verified at:
```
https://spl-trading-spl-temp.clover-plutonium.workers.dev
```
Version ID: `71ee9861-7743-4709-a782-f28516c94f41` (deployed with the `preview-props.json` loadManifest patch).

**Verification (all passing):**
| Route | Expected | Result |
|---|---|---|
| `GET /` | 200 | ✅ 64,891 bytes, renders SPL Trading landing |
| `GET /fees` | 200 | ✅ 43,382 bytes |
| `GET /contact` | 200 | ✅ |
| `GET /auth/sign-in`, `/auth/sign-up` | 200 | ✅ |
| `GET /api/v1/me` | 401 (unauthenticated) | ✅ |
| `GET /payins` (no session) | 307 (redirect) | ✅ |
| `POST /api/v1/auth/register` | 400 (missing fields) | ✅ |

**Live deploy prerequisites met:**
1. Cloudflare account with Workers + D1 enabled — ✅ (`Clover Plutonium`, account id `85ad8c59857be093bb0e2038762bb468`)
2. API credentials available — ✅ (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
3. D1 database provisioned and `database_id` set in `wrangler.jsonc` — ✅ (database `spl`, id `feb15556-711b-4bea-b599-a806fedff540`)
4. Schema applied (`wrangler d1 migrations apply spl`) — ✅ both migrations passed
5. `SPL_SESSION_SECRET` set — ✅ (see `.env.local`)

**Deploy command:** `npm run deploy` = `opennextjs-cloudflare build && node scripts/patch-load-manifest.mjs && opennextjs-cloudflare deploy`.

### ⚠️ Temporary account expiry

This deployment used a Cloudflare **temporary** account (`--temporary` flow) created during verification. The temporary account and the claim URL expire at **2026-10-10T14:53:12Z** (UTC). To keep the deployed worker alive, claim the account in a browser before expiry:
```
https://dash.cloudflare.com/claim-preview?claimToken=YJuIu4D55_9SsuRnsxBSn72I4EAkXEFZF-2XqtjK_3M
```
(Your browser will convert the temp account into a regular Cloudflare account; the worker URL and version persist.)

For a permanent production deploy, create a real Cloudflare account and store `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` as GitHub Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) for the CI deploy path in `.github/workflows/deploy.yml`, and set the real D1 `database_id` in `wrangler.jsonc` (never commit the API token).

### Telegram setup

Telegram integration (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_IDS`) powers the notification center / bot notifications (Slices 6–7, currently gated as a blocker). To set it up:

1. Open Telegram and message `@BotFather`.
2. Send `/newbot`, follow the prompts, and pick a name/username for your bot.
3. BotFather returns a **token** like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`. Add it to `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdef...
   ```
4. Send any message to your bot in Telegram; find your user ID via `@userinfobot` (or `@getmyid_bot`), and set `TELEGRAM_ADMIN_IDS` (comma-separated):
   ```
   TELEGRAM_ADMIN_IDS=123456789
   ```
5. Redeploy — the app reads these from the runtime environment.

---

*Analysis completed 2026-10-10 as part of "analyze n deploy live". Build: lint ✅, typecheck ✅, build ✅. Local env: `.env.local` + admin user `admin@spl.local` (password generated by `npm run seed:admin`). Site is **live** at https://spl-trading-spl-temp.clover-plutonium.workers.dev — see §11 for account expiry and permanent-deploy instructions.*
*Analysis generated 2026-10-10 as part of "analyze n deploy live". Build status: lint ✅, typecheck ✅, build ✅ (1.9s).*