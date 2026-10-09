# SPL TRADING — Project Handoff

**Date:** 2026-10-10
**Session:** 2026-10-09-spl-trading
**Status:** Slice 1–3 complete, `npm run check` passes clean

> **⚠ Deviation from AGENTS.md — deliberate.** On 2026-10-10 the user explicitly
> chose a **full visual redesign** over the "pixel-perfect emulation / no personal
> aesthetic changes" rule in AGENTS.md § Design Principles. The cabinet UI is now
> built on the project's own design system (`src/components/ui/*` + Tailwind
> tokens) rather than the captured PrimeReact markup. **This is no longer a
> pixel-faithful clone of sutra-reg.org.** `src/components/sites/spl-trading/auth.css`
> and `cabinet.css` are retained but the cabinet components no longer depend on
> their `p-*` classes. Reverting to fidelity means restoring the `p-*` markup —
> see `git diff` before that is attempted.

---

## 1. What This Is

A full Next.js 16 clone of **sutra-reg.org** (a "SPL TRADING" / trading-cabinet SaaS). The live site was reverse-engineered: logged in with the owner's real account, captured the authenticated ("inside") pages + assets, and rebuilt them locally with working credential-based login.

**Stack:** Next.js 16.4.0 (App Router, React 19, TypeScript strict), Tailwind CSS v4, shadcn/ui (Base UI primitives), Lucide React + primeicons, PrimeReact-style components recreated with Tailwind.

**Project root:** `/data/data/com.termux/files/home/projects/ai-website-cloner-template/`

---

## 2. What Was Built

### A. Discovery & Research (complete)
- Live site: `https://sutra-reg.org`
- Login endpoint: `POST /api/auth/login` body `{"email","password","token":""}` → sets HttpOnly `predeposit_session` JWT
- Profile: `GET /api/auth/me`
- Account: "[Redacted]", status `INTEGRATION`, non-admin, `canAccessAdminUi: false`
- Captured SSR HTML of `/`, `/payins`, `/payouts`, `/accounts`, `/onboarding`, `/report`, `/admin` (302) into `docs/research/sutra-reg/inside/`
- Route map, shell structure, per-page copy, deposit modal, deviations → `docs/research/sutra-reg/inside-brief.md`
- Auth pages brief → `docs/research/sutra-reg/page-brief.md`
- Extracted assets: `css/entry.BDPffK4Y.css`, `css/default.C8nT5cFj.css`, `css/index.D1yvIdsQ.css`, `fonts/primeicons.woff2` (only `.woff2` was copied; the other primeicons formats `.eot`/`.woff`/`.ttf`/`.svg` were **not** captured — CSS `@font-face` was patched to reference only the `.woff2`)

### B. Context System (complete, parallel track)
- `~/.config/opencode/context/spl-trading/` — full category: `navigation.md`, `concepts/clone-architecture`, `guides/build-workflow`, `lookup/route-map`, `errors/known-issues`
- Root `navigation.md` updated to point at spl-trading category
- Session context file: `.tmp/sessions/2026-10-09-spl-trading/context.md`
- Compaction batch 1 done (5 oversized files trimmed); batch 2 **dismissed by user** — do not resume without approval

### C. Auth Slice (complete)
- `src/lib/session.ts` — HMAC-signed `spl_session` cookie, `createSessionToken` / `readSessionToken` / `getSession()`. Secret: `process.env.SPL_SESSION_SECRET ?? "spl-trading-local-dev-secret"` (set `SPL_SESSION_SECRET` in production)
- `src/app/api/auth/login/route.ts` — proxies to live `POST https://sutra-reg.org/api/auth/login`, fetches `/api/auth/me` for name, sets `spl_session` cookie. Handles 429 / 401 / 502
- `src/app/api/auth/logout/route.ts` — clears `spl_session`
- `src/proxy.ts` — Next 16 route guard (middleware deprecated; `proxy.ts` is the new pattern). Guards `/`, `/payins`, `/payouts`, `/accounts`, `/onboarding`, `/report`, `/admin`. Redirects signed-in users away from `/auth/*`
- `src/components/sites/spl-trading/sign-in-form.tsx` — async submit → POST `/api/auth/login`, `router.replace("/")` + `refresh()` on success, error banners for 429/401/network, loading state

### D. Cabinet Slice (complete)
- `src/components/sites/spl-trading/cabinet/`
  - `cabinet-shell.tsx` — header (menu, Online chip, title, email/name, bell w/ notifications popover, user menu w/ logout), onboarding banner, drawer, mobile navbar. Reset-on-navigate via render-phase state adjustment (no `useEffect`)
  - `nav-items.ts` — NAV_ITEMS + NOTIFICATIONS
  - `dashboard-cards.tsx` — balance card (blurred + deposit-required overlay), notifications card, earnings card, deposit dialog (TRC20/ERC20, min 2000 USDT, demo disclosure)
  - `home-stats.tsx` — Overall Statistics, Activity Summary, Payin Success Rate
  - `list-views.tsx` — PayinsView, PayoutsView, AccountsView, ReportView (toolbars + empty tables, real copy from capture)
  - `onboarding-view.tsx` — 12 modules + help/progress sidebar
  - `cabinet.css` — concatenated entry + default + index CSS from live site (patched `@font-face` to woff2-only)
  - `primeicons.C6QP2o4f.woff2` — icon font
- Pages (all server components, `getSession()` guard + `redirect("/auth/sign-in")`):
  - `src/app/page.tsx` — session? Home shell : SignInForm
  - `src/app/payins/page.tsx`, `payouts/page.tsx`, `accounts/page.tsx`, `report/page.tsx`, `onboarding/page.tsx` — each wraps respective view in `CabinetShell`
  - `src/app/admin/page.tsx` — honest stub ("Admin console lives on a separate host", links to `https://moospage.com/users`)
- Metadata branded to "SPL Trading"

### E. Validation
- `npm run check` (lint + typecheck + build) → **all pass**
- Build output: 15 routes generated, no errors
- Note: `TypeCheck Router Staleness` pre-test may fail in baseline CI — this is pre-existing, not from our changes

---

## 3. File Inventory

```
src/
  app/
    page.tsx                          # Home (session switch)
    layout.tsx                        # Branded "SPL Trading", imports cabinet.css
    auth/
      sign-in/page.tsx
      sign-up/page.tsx
      forgot-password/page.tsx
    payins/page.tsx
    payouts/page.tsx
    accounts/page.tsx
    onboarding/page.tsx
    report/page.tsx
    admin/page.tsx                    # stub
    api/
      auth/login/route.ts
      auth/logout/route.ts
  components/
    sites/spl-trading/
      sign-in-form.tsx
      sign-up-flow.tsx
      forgot-password-form.tsx
      auth-shell.tsx
      auth-primitives.tsx
      theme-toggle.tsx
      icons.tsx
      cabinet/
        cabinet-shell.tsx
        nav-items.ts
        dashboard-cards.tsx
        home-stats.tsx
        list-views.tsx
        onboarding-view.tsx
        cabinet.css
        primeicons.C6QP2o4f.woff2
    ui/                               # shadcn primitives
  lib/
    session.ts                        # HMAC cookie helpers + getSession()
    utils.ts                          # cn()
  proxy.ts                            # Next 16 route guard
docs/research/sutra-reg/
  page-brief.md
  inside-brief.md
  inside/                             # SSR HTML + structure + css + fonts
.tmp/sessions/2026-10-09-spl-trading/context.md
```

---

## 4. How to Run

```bash
cd /data/data/com.termux/files/home/projects/ai-website-cloner-template

# Dev
npm run dev

# Validate (lint + typecheck + build)
npm run check

# Set production secret (do this before deploying)
export SPL_SESSION_SECRET="<your-random-secret>"
```

Login with the owner's real credentials (stored in shell history / env only — **never written to repo**). Max 2 login attempts (3rd triggers 15-min lockout, HTTP 429).

---

## 5. Constraints & Rules

- **Credentials never committed** — env/shell only. ≤2 login attempts.
- TypeScript strict, no `any`, named exports, 2-space indent, files <200 lines.
- Approval before destructive ops (`rm -rf`, `git push --force`, drop, format).
- Approval UI never auto-deletes.
- Deviations from source disclosed in UI (e.g., deposit dialog says "Demo deposit. No request is created.")
- No hidden network calls in page data.
- Termux on Android — use `pkg`, POSIX-compatible commands, no root.
- Subagents (ContextScout / CoderAgent / etc.) fail in this env ("OpenCode's free tier can only be used from within OpenCode") — execute directly.

---

## 6. Next Steps (pending)

1. **Living notes update** — ✅ DONE (v2.0, updated 2026-10-10: route-map, build-workflow, known-issues, navigation)
2. **Commit approval** — all changes are staged/untracked but **not committed**. Get explicit user approval before `git add` + `git commit`. Stage only intended files; never commit secrets.
3. **Session cleanup** — delete `.tmp/sessions/2026-10-09-spl-trading/` after confirmation
4. **Optional polish** — desktop drawer nav wiring, real pagination/filter logic (currently static empty states), deposit flow against live API (currently demo-only)
5. **`/admin`** — real admin lives on separate host (`moospage.com/users`); current stub is honest about this

---

## 7. Key Gotchas

- **Next 16 breaking changes:** route guard is `src/proxy.ts` (not `middleware.ts`), route handlers are standard `route.ts` with Web Request/Response. Docs: `node_modules/next/dist/docs/`
- **primeicons font:** only `.woff2` captured; `@font-face` in `cabinet.css` patched to reference only `primeicons.C6QP2o4f.woff2`. Other formats (`.eot`, `.woff`, `.ttf`, `.svg`) were not copied from live site.
- **Session secret:** defaults to `"spl-trading-local-dev-secret"` — set `SPL_SESSION_SECRET` in production.
- **Admin route:** `/admin` is inaccessible for this account (non-admin, `canAccessAdminUi: false`). Staff routes `/jfsdfkkkidsf234/sdfjeij3/*` return 404 — not cloned.
- **Credentials:** never write the owner's email/password into any file. They live only in shell/env.

---

**Handoff prepared by OpenAgent. Slice 1–3 complete, validation clean.**
