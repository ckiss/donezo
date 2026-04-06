# Story 1.1: Project Scaffold & Core Configuration

Status: review

## Story

As a developer,
I want the project scaffolded with all frontend and backend dependencies installed and core configuration in place,
so that the team has a clean, consistent starting point to build from.

## Acceptance Criteria

1. `npm run dev` starts Vite on :5173 and Fastify on :3000 concurrently with no errors
2. `src/types.ts` exists with the frontend `Task` interface (`id: string`, `text: string`, `completed: boolean`, `createdAt: string`)
3. `vite.config.ts` has `base: '/'`, the `@tailwindcss/vite` plugin, and proxy config forwarding `/api/*` to `http://localhost:3000`
4. `server/index.ts` exists with a Fastify app that registers `@fastify/cors` and serves a `GET /api/health` returning `{ status: "ok" }`
5. `server/db.ts` exports a singleton Prisma client instance
6. TypeScript strict mode is enabled and `npm run build` completes with no type errors
7. Tailwind utility classes render correctly in the browser

## Tasks / Subtasks

- [x] Task 1: Install backend dependencies (AC: 1, 4, 5)
  - [x] Run `npm install fastify @fastify/cors @fastify/static prisma @prisma/client`
  - [x] Run `npm install -D concurrently tsx`
  - [x] Also installed: `@prisma/adapter-pg`, `pg`, `@types/pg`, `dotenv` (required by Prisma 7 adapter pattern)
  - [x] Verify all deps resolve with no conflicts

- [x] Task 2: Update src/types.ts for API-backed architecture (AC: 2)
  - [x] Update `Task` interface: `createdAt` changed from `number` to `string` (ISO 8601)
  - [x] Updated all test files to use `new Date().toISOString()` instead of `Date.now()`
  - [x] Remove `src/constants.ts` (STORAGE_KEY no longer needed)

- [x] Task 3: Create server/db.ts — Prisma singleton (AC: 5)
  - [x] Create `server/` directory (with `routes/` subdirectory)
  - [x] Create `server/db.ts` using Prisma 7 adapter pattern: `PrismaPg` + `PrismaClient({ adapter })`
  - [x] Never instantiate PrismaClient anywhere else

- [x] Task 4: Create server/index.ts — Fastify app (AC: 4)
  - [x] Create `server/index.ts` with Fastify app setup
  - [x] Register `@fastify/cors` plugin
  - [x] Register `GET /api/health` route returning `{ status: "ok" }`
  - [x] In production: register `@fastify/static` to serve `dist/` directory with SPA fallback
  - [x] Listen on port 3000 (configurable via `PORT` env var)

- [x] Task 5: Configure Vite proxy (AC: 3)
  - [x] Add `server.proxy` to `vite.config.ts`: forward `/api` to `http://localhost:3000`
  - [x] Verified `base: '/'` is present
  - [x] Verified `@tailwindcss/vite` plugin is present

- [x] Task 6: Add concurrent dev script (AC: 1)
  - [x] Add `"dev:server": "tsx watch server/index.ts"` script to package.json
  - [x] Update `"dev"` script to use concurrently for Vite + Fastify
  - [x] Added `"start"` script for production mode

- [x] Task 7: Verify TypeScript and Tailwind (AC: 6, 7)
  - [x] Added `server/` and `generated/` to `tsconfig.node.json` include
  - [x] `npm run build` passes with zero type errors
  - [x] Initialized Prisma with `npx prisma init` and `npx prisma generate`

- [x] Task 8: Clean up old localStorage artifacts
  - [x] Removed Zustand `persist` middleware from store (replaced with plain Zustand store)
  - [x] Removed `src/constants.ts` (STORAGE_KEY)
  - [x] Removed `localStorage.clear()` from all test beforeEach blocks
  - [x] Removed localStorage persistence tests from store test file

## Dev Notes

### Architecture Context

**This is a brownfield story** — the project already exists with a working frontend (Vite + React + TypeScript + Tailwind + Zustand + Vitest + Playwright). This story adds the backend layer.

**Existing project state (from git/package.json):**
- Vite 8, React 19, Tailwind v4, Zustand 5 — all installed and working
- Vitest, RTL, Playwright, axe-core — all installed
- Frontend components exist in `src/components/` (TaskInput, TaskList, TaskItem, ErrorBoundary)
- Zustand store exists at `src/store/useTaskStore.ts` — currently uses `persist` middleware with localStorage
- `src/types.ts` has Task interface with `createdAt: number` (needs change to `string`)
- `src/constants.ts` has `STORAGE_KEY` (needs removal)

**What this story ADDS:**
- `fastify`, `@fastify/cors`, `@fastify/static`, `prisma`, `@prisma/client` (runtime deps)
- `concurrently`, `tsx` (dev deps for running server in dev)
- `server/index.ts` — Fastify app entry point
- `server/db.ts` — Prisma client singleton
- Vite proxy config for `/api/*`
- Concurrent dev script

**What this story CHANGES:**
- `src/types.ts` — `createdAt` from `number` to `string` (ISO 8601)
- `package.json` — new scripts, new deps
- `vite.config.ts` — add proxy config

**What this story REMOVES:**
- `src/constants.ts` (STORAGE_KEY) — no longer needed
- Any `persist` middleware references in store (will be fully rewritten in Story 3.1)

### Critical Architecture Rules

- **Never import `@prisma/client` in frontend code** (`src/` directory)
- **Never instantiate `PrismaClient` outside `server/db.ts`**
- **Frontend uses relative URLs** — `fetch('/api/tasks')`, never hardcoded host/port
- **Vite proxy** handles dev routing; in production, Fastify serves both API and static files
- **Fastify 5.8.4** — TypeScript-native, built-in JSON Schema validation
- **Prisma 7.6.0** — PostgreSQL provider, type-safe queries
- **`@fastify/cors` 11.2.0** — allow frontend origin

### Exact Versions (from architecture)

| Package | Version |
|---------|---------|
| fastify | 5.8.4 |
| @fastify/cors | 11.2.0 |
| @fastify/static | latest |
| prisma | 7.6.0 |
| @prisma/client | 7.6.0 |
| concurrently | latest |
| tsx | latest |

### File Structure (target state after this story)

```
server/
  index.ts              # Fastify app + health route
  db.ts                 # Prisma singleton
src/
  types.ts              # Updated: createdAt: string
  (existing frontend files unchanged)
vite.config.ts          # Updated: proxy config added
package.json            # Updated: new deps + scripts
```

### Testing Notes

- No new tests in this story (infrastructure only)
- Existing tests should still pass (AC changes to types.ts may require test updates)
- Verify `npm run build` passes
- Verify health endpoint manually: `curl http://localhost:3000/api/health`

### Project Structure Notes

- `server/` directory is a new top-level directory alongside `src/`
- Backend and frontend are separate directory trees — never import across the boundary
- Prisma schema will be added in Story 1.2 (NOT this story)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Backend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Prisma 7 requires `@prisma/adapter-pg` + `pg` driver with adapter pattern (not just `@prisma/client`)
- Prisma 7 requires explicit `output` path in schema generator config
- Generated Prisma client at `generated/prisma/client.ts` — imported with `.ts` extension for bundler resolution

### Completion Notes List

- All 8 tasks completed: backend deps installed, Fastify server created, Prisma singleton configured, Vite proxy added, concurrent dev scripts, TypeScript verified, localStorage artifacts cleaned up
- Build passes with zero type errors, all 33 existing tests pass
- Store temporarily simplified (persist middleware removed) — will be fully rewritten to async API actions in Story 3.1
- Additional packages beyond original spec: `@prisma/adapter-pg`, `pg`, `@types/pg`, `dotenv` (required by Prisma 7)

### File List

- **New:** `server/index.ts` — Fastify app with CORS, health route, static serving
- **New:** `server/db.ts` — Prisma client singleton with PrismaPg adapter
- **New:** `prisma/schema.prisma` — Prisma schema (PostgreSQL provider, empty model set)
- **New:** `prisma.config.ts` — Prisma config file (generated by prisma init)
- **New:** `.env` — DATABASE_URL placeholder
- **New:** `generated/prisma/` — Prisma generated client (auto-generated)
- **Modified:** `src/types.ts` — `createdAt` changed from `number` to `string`
- **Modified:** `src/store/useTaskStore.ts` — removed persist middleware, uses plain Zustand, ISO timestamps
- **Modified:** `src/store/useTaskStore.test.ts` — removed localStorage tests, updated createdAt assertion
- **Modified:** `src/components/TaskItem.test.tsx` — ISO timestamps, removed localStorage.clear
- **Modified:** `src/components/TaskList.test.tsx` — ISO timestamps, removed localStorage.clear, updated timestamp test
- **Modified:** `src/components/TaskInput.test.tsx` — removed localStorage.clear
- **Modified:** `vite.config.ts` — added proxy config for `/api`
- **Modified:** `tsconfig.node.json` — added `server` and `generated` to include
- **Modified:** `package.json` — new deps, new scripts (dev, dev:client, dev:server, start)
- **Deleted:** `src/constants.ts` — STORAGE_KEY no longer needed

### Change Log

- 2026-04-06: Story 1.1 implemented — backend foundation added (Fastify + Prisma + PostgreSQL adapter), frontend updated for API-backed architecture (ISO timestamps, localStorage removed), all tests passing
