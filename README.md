# SPL Trading

SPL Trading is a trading-cabinet web application built with the Next.js App Router: customers sign in to a personal cabinet to manage deposits (payins), withdrawals (payouts), trading accounts, referrals and reports, while operators run the platform from a separate admin console. The app uses local credential auth with an HMAC-signed session cookie and a SQLite data layer, and it was originally reverse-engineered from a reference site before moving onto its own design system (see `HANDOFF.md` for history and current status).

## Features

- **Authentication** — local email/password login with an HMAC-signed `spl_session` cookie (`src/lib/session.ts`), logout, and a route guard in `src/proxy.ts`.
- **Customer cabinet** — dashboard with balances, statistics and notifications (`src/app/page.tsx` + `src/components/sites/spl-trading/cabinet/`).
- **Deposits (payins)** — deposit flow with configurable min/max limits and network destination display.
- **Withdrawals (payouts)** — withdrawal requests with fee configuration.
- **Accounts** — account listing inside the cabinet.
- **Report** — account/report view for the customer.
- **Onboarding** — guided first-run flow for new customers.
- **Admin console** — role-gated `/admin` page for staff, linking to operator endpoints: platform overview, deposit orders, withdrawal requests, and config/feature flags (`src/app/api/v1/admin/*`).
- **Referrals** — referral tracking for customers (`src/lib/referrals.ts`, exposed at `/api/v1/referrals`).
- **Ledger** — double-entry-style transaction ledger behind the money-movement helpers (`src/lib/ledger.ts`).

Money-movement features are gated by feature flags (`src/lib/flags.ts`): they stay off unless explicitly enabled — see `SPL_LIVE_MODE` below.

## Tech stack

- **Next.js 16.4** — App Router, React 19, TypeScript strict
- **Tailwind CSS v4** — oklch design tokens
- **shadcn/ui** — Base UI primitives + `cn()` utility
- **SQLite / Cloudflare D1** — local dev and `npm run check` use `node:sqlite` at `data/spl.sqlite` (path overridable via `SPL_DB_PATH`), which applies migrations automatically on first use; the Workers deploy targets **Cloudflare D1**, where the schema is applied out-of-band with `npx wrangler d1 migrations apply spl` (the app never migrates D1 itself)
- **Auth** — local credentials + HMAC-signed session cookie (no external auth provider)

## Prerequisites

- [Node.js](https://nodejs.org/) **>= 24** (see `engines` in `package.json`). If you use [nvm](https://github.com/nvm-sh/nvm), `nvm install` picks up `.nvmrc` (24).
- npm (ships with Node).
- **Termux/Android note:** this repository is developed on Termux. `wrangler`/`workerd` (Cloudflare's local runtime) does **not** run on this host, so local `wrangler dev` and D1 simulation are unavailable there. Development and `npm run check` work fine; Cloudflare deploys run on Cloudflare/GitHub CI instead (see [Deployment](#deployment)).

## Setup

```bash
# 1. Install dependencies
npm ci

# 2. Create your local environment file
cp .env.example .env.local

# 3. Generate a session secret and put it in .env.local as SPL_SESSION_SECRET
openssl rand -hex 32

# 4. Create/seed the admin user (creates data/spl.sqlite if missing)
npm run seed:admin

# 5. Start the dev server
npm run dev
```

`npm run seed:admin` accepts optional arguments (`node scripts/seed-admin.mjs [email] [password]`) or reads `ADMIN_EMAIL` / `ADMIN_PASSWORD`; if no password is given it generates one and prints it. Keep those credentials safe — treat them like any other secret.

## Environment configuration

Copy `.env.example` to `.env.local` (local) and adjust. **`.env.example` contains placeholders only — never put real secrets in it.** Summary of the variables:

| Variable | Purpose |
|---|---|
| `SPL_SESSION_SECRET` | Secret used to sign the HMAC session cookie. Required in production. Generate with `openssl rand -hex 32`. |
| `SPL_DB_PATH` | Absolute path to the SQLite database file (defaults to `./data/spl.sqlite`). |
| `SPL_DATA_DIR` | Directory holding the database file; used when `SPL_DB_PATH` is unset. |
| `SPL_LIVE_MODE` | Set to `1` **only** in a controlled production environment after compliance sign-off. When unset or not `1`, all money-movement feature flags are forced off regardless of DB config. |
| `SPL_BEP20_ADDRESS` | Optional public BEP-20 receiving-address override. The admin-configurable DB key `bep20_deposit_address` takes precedence; otherwise the supplied app default is used. This is not a private key. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional inputs for `npm run seed:admin` (otherwise passed as CLI args or generated). |

Deployment/DB-layer placeholders (`CLOUDFLARE_*`, D1 `database_id`) and Telegram bot placeholders (`TELEGRAM_*`) are present in `.env.example` as **commented-out, not-yet-active** entries for upcoming work. The D1 `database_id` belongs in `wrangler.jsonc`, not in `.env.example`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server (`next dev --webpack`) |
| `npm run build` | Production build (`next build --webpack`) |
| `npm run start` | Serve the production build (`next start`) |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run check` | Full validation: lint + typecheck + build |
| `npm run seed:admin` | Create/seed the admin user into `data/spl.sqlite` |

Cloudflare deployment tooling (`@opennextjs/cloudflare` + `wrangler`) is a dependency and is configured for the Cloudflare Workers deploy path; the exact deploy/preview commands are being finalized alongside the D1 migration — see [Deployment](#deployment).

## Testing / validation

```bash
npm run check   # = npm run lint && npm run typecheck && npm run build
```

There is no separate unit-test suite; `npm run check` is the gate.

## Architecture

- **Routing** — App Router under `src/app/`. Public auth pages live in `src/app/auth/*`; the cabinet (`/`, `/payins`, `/payouts`, `/accounts`, `/onboarding`, `/report`) and `/admin` are protected. API routes live under `src/app/api/v1/*`.
- **Auth** — `src/lib/session.ts` signs/verifies the HMAC `spl_session` cookie. `src/proxy.ts` is the Next.js 16 route guard (middleware's successor here): it redirects anonymous users to `/auth/sign-in` and signed-in users away from the auth pages. Per-route authorization still happens in each API route.
- **Data layer** — `src/lib/db.ts` opens the SQLite database (`node:sqlite`) and exposes four helpers: `queryAll`, `queryOne`, `execute`, `withTransaction`. Feature code goes through these helpers rather than touching the driver directly.
- **Migrations** — SQL files in `src/lib/migrations/` (`001_init.sql` through `004_withdrawal_tx_hash_unique.sql`), tracked in a `_migrations` table. The local SQLite driver applies them in order at first use (dev/test/build); D1 never self-migrates — apply with `npx wrangler d1 migrations apply spl` (`wrangler.jsonc` sets `migrations_dir: src/lib/migrations`, and the `deploy.yml` CI job runs the command before deploy). The seed script mirrors the same ordered list.

## Deployment

**Configured target: Cloudflare Workers** via the [`@opennextjs/cloudflare`](https://www.npmjs.com/package/@opennextjs/cloudflare) adapter, a **D1** database, and **Cloudflare Workers Builds** (git-connected CI).

> **Status: configuration in progress — final verification pending.** The D1 migration and the first real deploy have **not** been completed yet, and no live URL should be assumed to work. Treat the steps below as the intended path, not a verified one.

What the deploy will require:

- A Cloudflare account with Workers + D1 enabled.
- `CLOUDFLARE_ACCOUNT_ID` and API credentials available to Workers Builds (placeholders are in `.env.example`).
- A provisioned D1 database and its `database_id` set in `wrangler.jsonc` (not committed as a secret here).
- A completed D1 migration of the schema (pending).

Deploys run on Cloudflare/GitHub CI — not on this Termux host, where `wrangler`/`workerd` cannot run.

**Alternative (verified path): VPS.** A self-contained Linux VPS guide using the SQLite file backend as-is lives at [`docs/deploy/vps-setup.md`](docs/deploy/vps-setup.md). Use it if you need a working deployment before the Cloudflare path is verified.

**Rollback:** revert the offending git commit and let Workers Builds redeploy, or promote the previous Cloudflare version from the Workers dashboard/rollback UI.

## Security

- Never commit secrets. `.env`, `.env.local`, and `.dev.vars*` are gitignored; keep it that way.
- `.env.example` and this README must only ever contain placeholders.
- Rotate `SPL_SESSION_SECRET` if it ever leaks — doing so invalidates all sessions.

## License

MIT — see [LICENSE](LICENSE).
