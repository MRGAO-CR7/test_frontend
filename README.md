# test_frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 frontend that
talks to a local **auth_service** (Microsoft Entra External ID proxy) and a
local **test_api** (business backend). Auth is handled by an in-process BFF
(Next Route Handlers) using the **memory + HttpOnly cookie** token pattern.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind v4 |
| Server state | `@tanstack/react-query` v5 |
| Client state | `zustand` |
| Forms | `react-hook-form` + `zod` |
| HTTP (browser) | `axios` (single-flight refresh) |
| HTTP (BFF -> upstream) | native `fetch` |
| Lint / format | ESLint 9 (flat) + Prettier 3 + `prettier-plugin-tailwindcss` |
| Package manager | `pnpm` 10 (via Corepack) |

## Architecture

```
Browser  ──►  Next.js (SPA + BFF)  ──►  auth_service  (login / refresh)
                                  ──►  test_api       (business; verifies JWT locally)
```

- `access_token` lives only in browser memory (zustand store).
- `refresh_token` is set by the BFF as an `HttpOnly Secure SameSite=Strict`
  cookie scoped to `Path=/api/auth`.
- All business calls go `SPA -> /api/test/[...slug] -> test_api` (the BFF
  catch-all proxy forwards the `Authorization: Bearer <access>` header).

## Project layout

```
src/
├─ app/
│  ├─ (auth)/          login / signup / verify pages
│  ├─ (protected)/     dashboard (and future protected pages)
│  └─ api/             BFF route handlers
│     ├─ auth/         login / signup / verify / refresh / logout / me
│     └─ test/[...slug]   catch-all proxy to test_api
├─ features/
│  ├─ auth/            { api, components, hooks, store }
│  └─ dashboard/       { api, components, hooks }
├─ shared/
│  ├─ api/             axios instance + single-flight refresh
│  ├─ guards/          AuthGuard / AuthBootstrap
│  ├─ lib/             jwt parsing, cookies, broadcast channel
│  ├─ config/          env validation (zod)
│  └─ components/      generic UI
└─ types/              cross-feature TS types
```

## Local setup

Prereqs: Node 20+, Docker, Corepack-enabled pnpm.

```bash
# 1) make sure auth_service is running on :8008 (a separate repo)
# 2) install + dev
pnpm install
pnpm dev
# open http://localhost:3000
```

> The Docker workflow lands in **Phase 5**. Until then `pnpm dev` is the
> shortest path; it talks to the host-exposed `auth_service` on `:8008`.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Run Next dev server with Turbopack on `:3000` |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint flat config |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm format` | Prettier write all |
| `pnpm format:check` | Prettier check (CI) |
| `pnpm typecheck` | `tsc --noEmit` |

## Environment variables

See `.env.example`. Copy to `.env.local` for local dev. Variables NOT prefixed
with `NEXT_PUBLIC_` are **server-only** and never reach the browser bundle.

## Phase status

- [x] Phase 1 — Scaffold + tooling + skeleton
- [x] Phase 2 — Infra: env, authStore, axios + single-flight, providers, broadcast
- [x] Phase 3 — BFF route handlers
- [x] Phase 4 — Pages (signup / verify / login / dashboard)
- [ ] Phase 5 — Docker compose (joins `bbm` external network)
- [ ] Phase 6 — Polish (multi-tab sync, error boundary, toast)
