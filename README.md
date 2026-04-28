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

Prereqs: Node 22+, Docker Desktop, Corepack-enabled pnpm.

### Option A — `pnpm dev` on the host

```bash
# 1) make sure auth_service is running on :8008 (a separate repo)
# 2) install + dev
pnpm install
pnpm dev
# open http://localhost:3000
```

`.env.local` points at host-exposed services (`localhost:8008`, `localhost:8009`).

### Option B — `docker compose up` (joins the `bbm` network)

```bash
# 0) one-time: make sure the shared bridge network exists
docker network inspect bbm >/dev/null 2>&1 || docker network create bbm

# 1) make sure auth_service is up and joined to bbm
(cd /path/to/auth_service && docker compose up -d)

# 2) start the frontend
docker compose up --build -d
docker compose logs -f test_frontend
# open http://localhost:3000

# stop without losing the pnpm/.next caches:
docker compose down
# wipe everything (slow next start, but fully clean):
docker compose down -v
```

What compose does:

- bind-mounts the project so `next dev` hot-reloads on edits;
- keeps `node_modules`, `.next`, and the pnpm store on **named volumes** so the
  host's macOS-built `node_modules` never shadows the linux one in the
  container;
- joins the external `bbm` network so the BFF reaches upstreams via Docker
  DNS — `auth_webserver:8000` and `test_api_webserver:8000` — instead of
  `localhost`.

Compose's `environment:` block overrides any matching key in `.env.local`
(Next.js never overwrites a value already in `process.env`), so the host and
container can use different upstream URLs without editing files.

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
- [x] Phase 5 — Docker compose (joins `bbm` external network)
- [x] Phase 6 — Polish (multi-tab sync, error boundaries, toast)
