# Story 1.2: Testing Infrastructure Setup

Status: done

## Story

As a developer,
I want Vitest, React Testing Library, and Playwright configured with all test scripts wired into `package.json`,
so that unit, integration, and E2E tests can be written and run from day one.

## Acceptance Criteria

1. `npm run test` executes Vitest in watch mode with jsdom environment and no errors
2. `npm run test:coverage` runs Vitest and produces a coverage report
3. `npm run test:e2e` runs Playwright against a running dev server
4. A smoke test exists for each layer — one Vitest test and one Playwright test — and both pass
5. `playwright.config.ts` targets localhost:5173 for dev and the dist preview for CI
6. `@axe-core/playwright` is importable in E2E test files

## Tasks / Subtasks

- [x] Task 1: Install missing test dependencies (AC: 2)
  - [x] Install `@vitest/coverage-v8` as devDependency (Vitest 4.x coverage provider — not included in Story 1.1)

- [x] Task 2: Configure Vitest in vite.config.ts (AC: 1, 2)
  - [x] Add `/// <reference types="vitest/config" />` triple-slash directive at top of vite.config.ts
  - [x] Add `test` block to defineConfig: `{ environment: 'jsdom', globals: true, setupFiles: './src/test-setup.ts' }`
  - [x] Create `src/test-setup.ts` with `import '@testing-library/jest-dom'` for custom matchers (toBeInTheDocument, etc.)

- [x] Task 3: Add test scripts to package.json (AC: 1, 2, 3)
  - [x] Add `"test": "vitest"` — runs Vitest in watch mode
  - [x] Add `"test:run": "vitest run"` — single run for CI
  - [x] Add `"test:coverage": "vitest run --coverage"` — coverage report
  - [x] Add `"test:e2e": "playwright test --config=e2e/playwright.config.ts"` — E2E tests
  - [x] Add `"test:e2e:ui": "playwright test --config=e2e/playwright.config.ts --ui"` — Playwright UI mode

- [x] Task 4: Create Playwright config (AC: 5)
  - [x] Create `e2e/playwright.config.ts` targeting localhost:5173 for dev and dist preview for CI
  - [x] Configure projects for Chromium, Firefox, WebKit (latest 2 versions per NFR-02)
  - [x] Configure webServer to start `npm run dev` automatically when running E2E tests locally
  - [x] Set baseURL to `http://localhost:5173`

- [x] Task 5: Write Vitest smoke test (AC: 4)
  - [x] Create `src/App.test.tsx` — smoke test that renders `<App />` and asserts it contains "Donezo"
  - [x] Run `npm run test:run` and confirm test passes
  - [x] Run `npm run test:coverage` and confirm coverage report is generated

- [x] Task 6: Write Playwright smoke test (AC: 4, 6)
  - [x] Create `e2e/smoke.spec.ts` — navigates to app and asserts page title or heading
  - [x] Import and verify `@axe-core/playwright` is importable (import `AxeBuilder` from `@axe-core/playwright`)
  - [x] Run `npm run test:e2e` and confirm test passes against dev server

- [x] Task 7: Verify all test commands work end-to-end (AC: 1, 2, 3, 4)
  - [x] `npm run test:run` — passes with no errors
  - [x] `npm run test:coverage` — produces coverage report
  - [x] `npm run test:e2e` — Playwright tests pass (6/6 across 3 browsers)
  - [x] `npm run build` — still passes with zero TypeScript errors

### Review Findings

- [x] [Review][Patch] Vacuous axe assertion — `expect(results.violations).toBeDefined()` never fails on real a11y violations [e2e/smoke.spec.ts:13]
- [x] [Review][Patch] AC5 — webServer always runs `npm run dev` in CI, missing dist-preview path [e2e/playwright.config.ts:20]
- [x] [Review][Patch] No `webServer.timeout` — CI hang risk if dev server fails to start [e2e/playwright.config.ts:19-23]
- [x] [Review][Defer] No test-specific tsconfig for `src/` test files — type errors invisible to tsc/IDE [tsconfig.app.json:28] — deferred, pre-existing
- [x] [Review][Defer] No tsconfig for `e2e/` directory — TS compilation errors are silent [e2e/] — deferred, pre-existing
- [x] [Review][Defer] `baseURL` hardcoded in two places in playwright.config.ts — minor sync maintenance risk [e2e/playwright.config.ts:11,21] — deferred, pre-existing

## Dev Notes

### CRITICAL: Dependencies Already Installed in Story 1.1

These are already in `devDependencies` from Story 1.1 — do NOT reinstall:
- `vitest@^4.1.2`
- `@testing-library/react@^16.3.2`
- `@testing-library/user-event@^14.6.1`
- `@testing-library/jest-dom@^6.9.1`
- `jsdom@^29.0.1`
- `@playwright/test@^1.59.1`
- `@axe-core/playwright@^4.11.1`

**Must install** (not included in Story 1.1):
```bash
npm install -D @vitest/coverage-v8
```

### Required: vite.config.ts (updated with test config)

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    css: true,
  },
})
```

- `environment: 'jsdom'` — required for React component testing (simulates browser DOM)
- `globals: true` — allows `describe`, `it`, `expect` without importing from vitest
- `setupFiles` — loads `@testing-library/jest-dom` matchers before each test
- `css: true` — processes CSS imports (needed because components import CSS)
- **Do NOT create a separate `vitest.config.ts`** — configure inline in `vite.config.ts` per architecture

### Required: src/test-setup.ts

```ts
import '@testing-library/jest-dom'
```

This single import enables jest-dom matchers (`toBeInTheDocument()`, `toHaveTextContent()`, etc.) globally for all Vitest tests.

### Required: e2e/playwright.config.ts

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

- `testDir: '.'` — tests live in the `e2e/` directory alongside the config
- `webServer` — auto-starts Vite dev server for local runs; CI should start its own server
- `baseURL` — all `page.goto('/')` calls resolve to localhost:5173
- Three browser projects per NFR-02 (Chrome, Firefox, Safari)
- `forbidOnly: !!process.env.CI` — prevents `.only` from leaking to CI

### Required: package.json scripts

Add these scripts to the existing `"scripts"` block:

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test --config=e2e/playwright.config.ts",
"test:e2e:ui": "playwright test --config=e2e/playwright.config.ts --ui"
```

### Required: Vitest smoke test — src/App.test.tsx

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the Donezo heading', () => {
    render(<App />)
    expect(screen.getByText('Donezo')).toBeInTheDocument()
  })
})
```

- Test file co-located with `App.tsx` per architecture naming convention (`.test.tsx` suffix)
- Uses RTL `render` + `screen` pattern — consistent with all future component tests
- `getByText` queries the DOM by visible text — RTL best practice

### Required: Playwright smoke test — e2e/smoke.spec.ts

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('app loads and displays heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Donezo')
})

test('axe-core is importable and runs without errors', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  // This verifies @axe-core/playwright works; actual WCAG audit is Story 4.2
  expect(results.violations).toBeDefined()
})
```

- The second test confirms AC6 (`@axe-core/playwright` is importable) by running a real axe audit
- `page.goto('/')` uses `baseURL` from playwright config → `http://localhost:5173/`

### Previous Story Intelligence (Story 1.1)

**What was established:**
- Vite 8.0.3 + React 19 + TypeScript 5.9 scaffold
- `vite.config.ts` has `base: '/'`, react() and tailwindcss() plugins
- `App.tsx` renders `<main><h1>Donezo</h1></main>` with Tailwind classes
- `tsconfig.app.json` has `"strict": true`, `"noUnusedLocals": true`
- All test devDeps installed but zero configuration

**Review deferred items now addressed by this story:**
- "No test configuration / npm test will fail" — this story fixes it entirely

### Anti-Patterns — Do NOT Do These

- ❌ Do not create `vitest.config.ts` — configure inside `vite.config.ts` per architecture
- ❌ Do not put Playwright config at project root — it goes in `e2e/playwright.config.ts` per architecture
- ❌ Do not put unit/component tests in `e2e/` — unit tests are co-located with components in `src/`
- ❌ Do not put E2E tests in `src/` — they go in the `e2e/` directory
- ❌ Do not create a `__tests__/` directory — tests are co-located (`.test.tsx` suffix)
- ❌ Do not import from `vitest` when `globals: true` is set (describe/it/expect are global)
- ❌ Do not hardcode port numbers in multiple places — use `baseURL` in Playwright config

### Project Structure After This Story

```
donezo/
├── package.json                ← updated with test scripts
├── vite.config.ts              ← updated with test config block
├── src/
│   ├── test-setup.ts           ← CREATED (jest-dom matchers)
│   ├── App.test.tsx            ← CREATED (Vitest smoke test)
│   ├── App.tsx
│   ├── App.css
│   ├── types.ts
│   ├── constants.ts
│   └── main.tsx
└── e2e/
    ├── playwright.config.ts    ← CREATED (Playwright config)
    └── smoke.spec.ts           ← CREATED (Playwright smoke test)
```

### TypeScript Considerations

- `vitest/config` triple-slash directive extends `UserConfig` to include the `test` property — without it, TypeScript will error on the `test` block
- If `globals: true` is set, also add `"types": ["vitest/globals"]` to `tsconfig.app.json` compilerOptions for type support (or use the triple-slash directive in test files)
- Playwright test files in `e2e/` may need their own `tsconfig.json` if they aren't included in the `src` include path

### Coverage Notes

- `@vitest/coverage-v8` uses V8's built-in code coverage — fast and accurate
- 70% minimum meaningful coverage is enforced in CI (Story 1.4) — this story just sets up the tooling
- Coverage report outputs to `coverage/` directory (add to `.gitignore`)

### References

- Testing Stack: [Source: architecture.md#Core Architectural Decisions → Testing Stack]
- QA Activities: [Source: architecture.md#QA Activities]
- Test scripts: [Source: architecture.md#QA Activities → Test Infrastructure]
- Playwright config: [Source: architecture.md#Project Structure & Boundaries]
- Co-located tests: [Source: architecture.md#Implementation Patterns → Naming Patterns]
- Story 1.2 ACs: [Source: epics.md#Story 1.2: Testing Infrastructure Setup]
- Previous story review: [Source: 1-1-project-scaffold-and-core-configuration.md#Senior Developer Review]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- Vitest initially picked up `e2e/smoke.spec.ts` as a test file, causing Playwright's `test()` to conflict. Fixed by adding `exclude: ['e2e/**', 'node_modules/**']` to the Vitest test config.
- `npm run build` failed with TS2593 errors — `describe`/`it`/`expect` not recognized in test files. Fixed by excluding `src/**/*.test.ts` and `src/**/*.test.tsx` from `tsconfig.app.json` include.

### Completion Notes List

- Installed `@vitest/coverage-v8` for V8-based coverage reporting
- Configured Vitest in `vite.config.ts`: jsdom environment, globals, setup file, CSS processing, e2e exclusion
- Created `src/test-setup.ts` for jest-dom matchers
- Added 5 test scripts to `package.json`: test, test:run, test:coverage, test:e2e, test:e2e:ui
- Created `e2e/playwright.config.ts`: 3 browser projects (Chromium, Firefox, WebKit), webServer auto-start, baseURL localhost:5173
- Vitest smoke test: 1 test, 1 pass (renders App, asserts "Donezo" heading)
- Playwright smoke test: 2 tests × 3 browsers = 6 pass (heading check + axe-core import verification)
- Coverage report generates successfully (100% on App.tsx)
- Excluded test files from `tsconfig.app.json` build to prevent TypeScript errors
- Added coverage/, test-results/, playwright-report/, blob-report/ to .gitignore

### File List

- `package.json` (modified — 5 test scripts added, @vitest/coverage-v8 added)
- `vite.config.ts` (modified — vitest/config reference, test block with jsdom/globals/setupFiles/exclude)
- `tsconfig.app.json` (modified — exclude test files from build)
- `.gitignore` (modified — test artifact directories added)
- `src/test-setup.ts` (created — @testing-library/jest-dom import)
- `src/App.test.tsx` (created — Vitest smoke test)
- `e2e/playwright.config.ts` (created — Playwright configuration)
- `e2e/smoke.spec.ts` (created — Playwright smoke test with axe-core verification)
