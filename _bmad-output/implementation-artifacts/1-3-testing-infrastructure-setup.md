# Story 1.3: Testing Infrastructure Setup

Status: review

## Story

As a developer,
I want Vitest, React Testing Library, Playwright, and API integration test patterns configured,
so that unit, component, API integration, and E2E tests can be written from day one.

## Acceptance Criteria

1. `npm run test` runs Vitest in watch mode with jsdom environment and no errors
2. `npm run test:coverage` produces a coverage report
3. `npm run test:e2e` runs Playwright against a running dev server
4. A smoke test exists for each layer: Vitest unit, RTL component, Fastify inject API, Playwright E2E — all pass
5. API integration tests use `@vitest-environment node` comment to run in Node (not jsdom)
6. `@axe-core/playwright` is importable in E2E test files

## Tasks / Subtasks

- [x] Task 1: Extract Fastify app factory for testability
  - [x] Created `server/app.ts` with `buildApp()` factory function
  - [x] Refactored `server/index.ts` to use `buildApp()`
  - [x] Extracted health route to `server/routes/health.ts` module

- [x] Task 2: Create API smoke test with Fastify inject
  - [x] Created `server/routes/health.test.ts` using `app.inject()` pattern
  - [x] Used `@vitest-environment node` comment for Node environment
  - [x] Test verifies `GET /api/health` returns 200 with `{ status: "ok" }`

- [x] Task 3: Fix test-setup.ts for dual environment
  - [x] Guarded `window.localStorage` override with `typeof window !== 'undefined'`
  - [x] Server tests now run in Node environment without errors

- [x] Task 4: Verify all test layers pass
  - [x] 7 test files, 34 tests — all pass
  - [x] Build passes with zero type errors

## Dev Notes

### Key Pattern: Fastify App Factory

`server/app.ts` exports `buildApp()` which creates a Fastify instance with all plugins and routes registered. This enables:
- `server/index.ts` — calls `buildApp()` then starts listening
- Tests — call `buildApp()` then use `app.inject()` without starting a real server

### API Test Pattern

```ts
// @vitest-environment node
import { buildApp } from '../app.ts'

const app = await buildApp()
const response = await app.inject({ method: 'GET', url: '/api/health' })
expect(response.statusCode).toBe(200)
await app.close()
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Testing Stack]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Extracted app factory pattern for Fastify testability
- Created API smoke test using Fastify inject
- Fixed test-setup.ts to support both jsdom and Node environments
- All 34 tests pass across 7 files

### File List

- **New:** `server/app.ts` — Fastify app factory
- **New:** `server/routes/health.ts` — health route module
- **New:** `server/routes/health.test.ts` — API smoke test
- **Modified:** `server/index.ts` — refactored to use buildApp()
- **Modified:** `src/test-setup.ts` — guarded window reference for Node env
- **Modified:** `vite.config.ts` — switched to vitest/config import

### Change Log

- 2026-04-06: Story 1.3 implemented — API test infrastructure with Fastify inject pattern, app factory for testability
