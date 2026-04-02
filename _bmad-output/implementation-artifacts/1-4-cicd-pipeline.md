# Story 1.4: CI/CD Pipeline

Status: review

## Story

As a developer,
I want a GitHub Actions workflow that runs tests, builds, and deploys the Docker image on every push to `main`,
so that every merge to main is automatically tested and deployed.

## Acceptance Criteria

1. Given a push to `main`, the GitHub Actions workflow triggers and runs `npm ci`, `npm run test:coverage` (enforcing ≥70% coverage), and `npm run build` in sequence
2. If any step fails, the workflow stops and deployment does not proceed
3. The Docker image is built and pushed to the configured container registry (GHCR)
4. `npm audit` is run and the workflow fails on any high or critical vulnerabilities
5. The workflow file is at `.github/workflows/deploy.yml`
6. The deployment target is documented in `README.md` with setup steps ≤5

## Tasks / Subtasks

- [x] Task 1: Add coverage thresholds to `vite.config.ts` (AC: 1)
  - [x] Add `coverage` block inside `test`: `provider: 'v8'`, `reporter: ['text', 'lcov', 'json-summary']`, `thresholds: { statements: 70, branches: 70 }`
  - [x] Run `npm run test:coverage` locally to verify thresholds pass and lcov output is generated

- [x] Task 2: Create `.github/workflows/deploy.yml` (AC: 1, 2, 3, 4, 5)
  - [x] Create `.github/` and `workflows/` directories
  - [x] Author the 3-job workflow: `test` → `e2e` → `docker`
  - [x] `test` job: `actions/checkout@v4`, `actions/setup-node@v6` with `cache: 'npm'`, `npm ci`, `npm run lint`, `npm run test:coverage`, `npm run build`, `npm audit --audit-level=high`
  - [x] `e2e` job (needs: test): `npm ci`, `npx playwright install --with-deps`, `npm run test:e2e`, upload Playwright report artifact
  - [x] `docker` job (needs: [test, e2e], only on main): login to GHCR with `GITHUB_TOKEN`, extract metadata, build and push with `docker/build-push-action@v7` with GHA layer caching
  - [x] Set `permissions: packages: write` on docker job for GHCR push

- [x] Task 3: Create `README.md` with deployment documentation (AC: 6)
  - [x] Document project overview (Donezo — single-user React todo SPA)
  - [x] Document local dev setup (≤5 steps: clone, npm install, npm run dev)
  - [x] Document Docker local run (≤5 steps: docker compose up --build)
  - [x] Document GHCR deployment with ≤5 steps
  - [x] List all available npm scripts

- [x] Task 4: Verify CI pipeline passes locally (AC: 1, 2, 4)
  - [x] `npm run lint` — passes with no errors
  - [x] `npm run test:coverage` — passes with ≥70% coverage and lcov report generated
  - [x] `npm run build` — passes with zero TypeScript errors
  - [x] `npm audit --audit-level=high` — passes with no high/critical vulnerabilities

## Dev Notes

### CRITICAL: npm ci in CI vs npm install in Dockerfile

**In GitHub Actions** (`deploy.yml`): use `npm ci` — this is correct for CI.
- `actions/setup-node@v6` with `cache: 'npm'` caches `~/.npm` keyed on `package-lock.json`
- The lock file cross-platform issue from Story 1.3 (missing `@emnapi/core`) was specific to Docker with macOS-generated lock file
- GitHub Actions runners are `ubuntu-latest` — if the same missing-package error occurs, use `npm install` as fallback (same as Dockerfile fix)

**In Dockerfile**: `npm install` (NOT `npm ci`) — already established in Story 1.3 due to macOS→Linux lock file mismatch with optional packages (`@emnapi/core`, `@emnapi/runtime`).

### Required: vite.config.ts coverage block

Add inside the `test` block (do NOT create a separate `vitest.config.ts`):

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
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        statements: 70,
        branches: 70,
      },
    },
  },
})
```

- `provider: 'v8'` — matches `@vitest/coverage-v8` already installed (Story 1.2)
- `reporter: ['text', 'lcov', 'json-summary']` — `text` for terminal output, `lcov` for Codecov/artifact upload, `json-summary` for CI summary
- `thresholds` — enforced at runtime; `npm run test:coverage` fails if coverage drops below 70%
- Coverage output goes to `coverage/` directory (already in `.gitignore`)

### Required: .github/workflows/deploy.yml

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Unit tests with coverage
        run: npm run test:coverage

      - name: Upload coverage artifact
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 14

      - name: Build
        run: npm run build

      - name: Security audit
        run: npm audit --audit-level=high

  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: test

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

  docker:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v6
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Key design decisions:**
- **Node 24** (Active LTS "Krypton") in CI — NOT Node 25 (EOL June 2026, not LTS). Node 24 is the recommended production runtime.
- **GHCR** (`ghcr.io`) — uses built-in `GITHUB_TOKEN`, zero extra secrets, free for public repos
- **3 separate jobs** — test → e2e → docker; each gated on previous success (AC2)
- **`permissions: packages: write`** on docker job — required for GHCR push with `GITHUB_TOKEN`
- **`type=gha` cache** for Docker layers — speeds up rebuilds significantly
- **docker job only on `main`** — PRs run tests/e2e but don't push images
- **`if: ${{ !cancelled() }}`** on Playwright artifact — captures report even on test failure (official Playwright CI guidance)
- **Coverage artifact upload** (no Codecov) — zero external service dependency for solo project

### E2E in CI — Playwright webServer

The Playwright config (`e2e/playwright.config.ts`) already has CI mode configured (Story 1.2 + patches):
- `workers: process.env.CI ? 1 : undefined` — serial in CI
- `retries: process.env.CI ? 2 : 0` — retries in CI
- `reuseExistingServer: !process.env.CI` — starts fresh server in CI
- `command: process.env.CI ? 'npm run build && npm run preview -- --port 5173' : 'npm run dev'` — uses dist preview in CI

This means the E2E job doesn't need to manually start a server — Playwright handles it via `webServer`. The `npm run build` step in the `test` job runs before `e2e`, but since jobs run in separate environments, the `e2e` job re-runs `npm ci` and Playwright's webServer runs its own build internally.

### npm audit behavior

`npm audit --audit-level=high` exits non-zero only on `high` or `critical` vulnerabilities.
- Current project: `0 vulnerabilities` (confirmed from Story 1.3 build)
- If audit fails in CI, the workflow stops before Docker push (AC2, AC4)
- `moderate` and `low` vulnerabilities are allowed through (acceptable for a learning project)

### Action versions (verified April 2026)

| Action | Version | Notes |
|--------|---------|-------|
| `actions/checkout` | `v4` | Stable major pin |
| `actions/setup-node` | `v6` | Latest; supports `devEngines` |
| `actions/upload-artifact` | `v4` | Latest |
| `docker/login-action` | `v4` | Node 24 runtime |
| `docker/metadata-action` | `v6` | Node 24 runtime |
| `docker/build-push-action` | `v7` | Node 24 runtime, ESM |

### Anti-Patterns — Do NOT Do These

- ❌ Do NOT use Node 25 in `actions/setup-node` — use `node-version: '24'` (Active LTS)
- ❌ Do NOT cache `node_modules/` directly — use `setup-node` with `cache: 'npm'` which caches `~/.npm`
- ❌ Do NOT push Docker image on PRs — only push when `github.ref == 'refs/heads/main'`
- ❌ Do NOT hardcode secrets in the workflow — use `secrets.GITHUB_TOKEN` for GHCR
- ❌ Do NOT create a separate `vitest.config.ts` — add coverage config inside `vite.config.ts`
- ❌ Do NOT use `npm audit` without `--audit-level=high` — bare `npm audit` fails on moderate vulns
- ❌ Do NOT cache Playwright browsers — restoration time equals download time per official docs
- ❌ Do NOT put `.github/` in `.gitignore` — it must be committed

### Previous Story Intelligence (Stories 1.1–1.3)

**What was established:**
- `npm run lint` — ESLint configured (eslint.config.js from Story 1.1)
- `npm run test:run` — single Vitest run (for CI unit tests without coverage)
- `npm run test:coverage` — Vitest with coverage → `coverage/` directory
- `npm run test:e2e` — Playwright test with config at `e2e/playwright.config.ts`
- `npm run build` — `tsc -b && vite build` → `dist/` (~200KB)
- `Dockerfile` — `node:25-alpine` build, `nginx:alpine` serve (Story 1.3)
- `.dockerignore` — excludes node_modules, dist, .git, test artifacts

**Story 1.3 debug intelligence for CI Dockerfile builds:**
- Docker uses `npm install` not `npm ci` (cross-platform lock file issue)
- HEALTHCHECK uses `127.0.0.1` not `localhost` (Alpine IPv6 DNS issue)
- These are in the Dockerfile already — CI just runs `docker/build-push-action` which uses the committed Dockerfile

### Project Structure After This Story

```
donezo/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← CREATED (CI/CD pipeline)
├── README.md                   ← CREATED (deployment docs)
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── vite.config.ts              ← MODIFIED (coverage thresholds added)
├── ...
```

### References

- CI/CD flow: [Source: architecture.md#External Integrations → CI/CD Flow]
- Coverage threshold: [Source: architecture.md#Quality Gates → Coverage]
- Security audit: [Source: architecture.md#Quality Gates → Security]
- NFR-05 (deployability): [Source: prd-donezo.md#NFR-05]
- AR-09: GitHub Actions workflow [Source: epics.md#Story 1.4]
- AR-10: Coverage ≥70% enforced [Source: epics.md#Story 1.4]
- AR-11: npm audit no high/critical [Source: epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm run lint` initially reported 3 warnings from `coverage/lcov-report/*.js` — ESLint was scanning the generated coverage directory. Fixed by adding `'coverage'` to `globalIgnores` in `eslint.config.js`.

### Completion Notes List

- Added coverage config to `vite.config.ts`: V8 provider, lcov+json-summary reporters, 70% thresholds on statements and branches
- Created `.github/workflows/deploy.yml`: 3-job pipeline (test → e2e → docker) triggered on push/PR to main
- Docker push to GHCR only on `main` merges using built-in `GITHUB_TOKEN` — no extra secrets
- Node 24 (Active LTS) used in CI, not Node 25 (EOL June 2026)
- GHA Docker layer cache (`type=gha`) for fast rebuilds
- Created `README.md` replacing Vite scaffold boilerplate: project overview, scripts, Docker and GHCR deployment (≤5 steps)
- Fixed `eslint.config.js` to ignore `coverage/` directory
- All local verification passes: lint, test:coverage (100%), build, npm audit (0 vulnerabilities)

### File List

- `vite.config.ts` (modified — coverage block with thresholds)
- `eslint.config.js` (modified — added coverage to globalIgnores)
- `.github/workflows/deploy.yml` (created — CI/CD pipeline)
- `README.md` (modified — replaced boilerplate with project docs)
