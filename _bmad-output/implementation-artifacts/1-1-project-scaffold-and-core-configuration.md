# Story 1.1: Project Scaffold & Core Configuration

Status: done

## Story

As a developer,
I want the project scaffolded with all dependencies installed and core configuration files in place,
so that the team has a clean, consistent starting point to build from.

## Acceptance Criteria

1. `npm run dev` starts a Vite dev server on localhost:5173 with no errors (after running from a clean working directory using the scaffold and install commands below)
2. `src/types.ts` exists with the canonical `Task` interface (`id: string`, `text: string`, `completed: boolean`, `createdAt: number`)
3. `src/constants.ts` exists with `export const STORAGE_KEY = 'donezo_tasks'`
4. `vite.config.ts` has `base: '/'` and the `@tailwindcss/vite` plugin configured
5. TypeScript strict mode is enabled and `npm run build` completes with no type errors
6. Tailwind utility classes render correctly in the browser — verified by adding a test utility class (e.g., `className="text-blue-500"`) to `App.tsx` and confirming it applies in the browser

## Tasks / Subtasks

- [x] Task 1: Scaffold project (AC: 1, 4, 5)
  - [x] Run scaffold command (see Dev Notes — exact command required)
  - [x] Run `npm install` to install base deps
  - [x] Install runtime dependencies: `npm install tailwindcss @tailwindcss/vite zustand`
  - [x] Install dev dependencies: `npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom`
  - [x] Install E2E dependencies: `npm install -D @playwright/test @axe-core/playwright`
  - [x] Run `npx playwright install --with-deps`

- [x] Task 2: Configure vite.config.ts (AC: 4)
  - [x] Add `base: '/'` to Vite config
  - [x] Add `@tailwindcss/vite` plugin (see exact config in Dev Notes)
  - [x] Verify `npm run build` passes with no type errors

- [x] Task 3: Create src/types.ts (AC: 2)
  - [x] Create `src/types.ts` with the canonical `Task` interface exactly as specified (see Dev Notes)
  - [x] No other types in this file at this stage

- [x] Task 4: Create src/constants.ts (AC: 3)
  - [x] Create `src/constants.ts` with `STORAGE_KEY` export exactly as specified

- [x] Task 5: Enable TypeScript strict mode (AC: 5)
  - [x] Verify `tsconfig.json` and/or `tsconfig.app.json` has `"strict": true` (Vite react-ts template includes this — verify it is not missing)
  - [x] Confirm `npm run build` passes with zero errors after creating types.ts and constants.ts

- [x] Task 6: Verify Tailwind rendering (AC: 6)
  - [x] Add a Tailwind utility class to `App.tsx` (e.g., `<h1 className="text-blue-500">Donezo</h1>`)
  - [x] Run `npm run dev` and confirm the class applies visually in the browser
  - [x] Remove or keep as placeholder — do not leave broken markup

- [x] Task 7: Clean up Vite scaffold boilerplate
  - [x] Remove Vite default CSS content from `App.css` — replace with Tailwind `@import "tailwindcss"` directive only
  - [x] Remove Vite default boilerplate from `App.tsx` — replace with a minimal shell (`<main>Donezo</main>`)
  - [x] Confirm `npm run dev` and `npm run build` still pass

### Senior Developer Review (AI)

**Review Date:** 2026-04-02
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Changes Requested (1 decision-needed, 1 patch)

#### Action Items

- [x] [Review][Decision] STORAGE_KEY versioning — Keep `donezo_tasks` (matches architecture doc; migration via Zustand persist `version` option in v2 if needed) [src/constants.ts:3]
- [x] [Review][Patch] Clarify `createdAt` comment — changed "Unix millisecond timestamp" to "milliseconds since epoch" [src/types.ts:8]
- [x] [Review][Defer] Non-null assertion on `getElementById('root')` [src/main.tsx:6] — deferred, Vite template default; index.html has `<div id="root">`; low practical risk
- [x] [Review][Defer] `crypto.randomUUID()` secure context requirement [src/types.ts:5] — deferred, Story 2.1 scope when store is implemented
- [x] [Review][Defer] No test configuration / `npm test` will fail [package.json] — deferred, Story 1.2 scope (Testing Infrastructure)
- [x] [Review][Defer] No input sanitization / CSP architecture — deferred, Story 1.4 scope (AR-11 security audit)
- [x] [Review][Defer] `Task.text` trimming constraint unenforced at type level [src/types.ts:6] — deferred, deliberately enforced in store action (Story 2.1)
- [x] [Review][Defer] No localStorage deserialization validation [src/constants.ts] — deferred, Story 2.1 `onRehydrateStorage` callback scope
- [x] [Review][Defer] `erasableSyntaxOnly: true` constraint undocumented for contributors [tsconfig.app.json] — deferred, informational; low priority

## Dev Notes

### CRITICAL: Exact Scaffold Commands

Run these commands **in order** from the parent directory of where the project should live:

```bash
npm create vite@latest donezo -- --template react-ts
cd donezo
npm install
npm install tailwindcss @tailwindcss/vite zustand
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps
```

**Do NOT use a different template** — `react-ts` is required (React + TypeScript, Vite-native).

### Required: vite.config.ts

The exact configuration the dev must produce:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

- `base: '/'` is required for Docker/nginx and Vercel/AWS deployment — **never use `/donezo/` or a sub-path**
- `@tailwindcss/vite` is the Tailwind v4 integration — **no `tailwind.config.js` file is created** (v4 does not need one)

### Required: App.css

Replace all Vite default content with:

```css
@import "tailwindcss";
```

That single line is the entire file. No other configuration needed for Tailwind v4.

### Required: src/types.ts

Create this file exactly — it is the **canonical source of truth** for the Task shape. All other files import from here; never redefine it locally.

```ts
// Identity-agnostic task model.
// To support multi-user in v2: add `userId: string` field and user context to the store.
// No structural redesign needed — only additive changes required (FR-10).
export interface Task {
  id: string        // crypto.randomUUID() — never sequential integers
  text: string      // trimmed before storage; never empty string
  completed: boolean
  createdAt: number // Date.now() — Unix millisecond timestamp
}
```

### Required: src/constants.ts

```ts
// Single source of truth for the localStorage key.
// Import STORAGE_KEY from here — never hardcode 'donezo_tasks' anywhere else.
export const STORAGE_KEY = 'donezo_tasks'
```

### TypeScript Strict Mode

The `react-ts` Vite template enables `"strict": true` in `tsconfig.app.json` by default. Verify it is present — do **not** remove it. All subsequent stories rely on strict mode being active.

### Anti-Patterns — Do NOT Do These

- ❌ Do not create `tailwind.config.js` — Tailwind v4 does not use one
- ❌ Do not add `content: [...]` array to any config — not needed with the Vite plugin
- ❌ Do not use `postcss.config.js` for Tailwind — the `@tailwindcss/vite` plugin replaces PostCSS integration
- ❌ Do not hardcode `'donezo_tasks'` anywhere — always `import { STORAGE_KEY } from '../constants'`
- ❌ Do not redefine `interface Task` in any component — always `import { Task } from '../types'`
- ❌ Do not set `base: '/donezo/'` — deployment target is Docker/nginx + Vercel/AWS, not GitHub Pages

### Tailwind v4 Key Difference from v3

In Tailwind v4:
- No config file needed
- Import via CSS: `@import "tailwindcss"` (replaces `@tailwind base/components/utilities` directives)
- Plugin via `@tailwindcss/vite` in `vite.config.ts`
- All utility classes work as expected; design tokens auto-generated from usage

### Stack Versions (from architecture)

| Package | Version |
|---|---|
| Vite | 8.0.3 (Rolldown-powered) |
| React | 19 (bundled with react-ts template) |
| TypeScript | 5.x (bundled with react-ts template) |
| Tailwind CSS | v4 (via @tailwindcss/vite) |
| Zustand | 5.x (latest) |
| Vitest | 3.x (latest) |
| Playwright | 1.x (latest) |

### Project Structure After This Story

This story establishes the root skeleton. Subsequent stories fill in the implementation:

```
donezo/
├── package.json
├── vite.config.ts              ← must have base:'/' + tailwindcss() plugin
├── tsconfig.json
├── tsconfig.app.json           ← must have "strict": true
├── index.html
├── .gitignore
└── src/
    ├── main.tsx                ← untouched (Vite default is fine)
    ├── App.tsx                 ← minimal shell (boilerplate removed)
    ├── App.css                 ← @import "tailwindcss" only
    ├── types.ts                ← CREATED in this story (canonical Task interface)
    └── constants.ts            ← CREATED in this story (STORAGE_KEY)
```

Files NOT created in this story (created in later stories):
- `src/store/useTaskStore.ts` → Story 2.1
- `src/components/` → Stories 2.2, 2.3, 2.4, 3.x
- `Dockerfile`, `nginx.conf`, `docker-compose.yml` → Story 1.3
- `.github/workflows/deploy.yml` → Story 1.4
- `e2e/` → Story 1.2

### Testing Notes for This Story

This is the scaffold story — no application tests are written here. The testing infrastructure setup is Story 1.2. However:
- Confirm `npm run dev` and `npm run build` work without error
- Confirm Tailwind applies visually (manual browser check)
- Confirm TypeScript has zero errors on build

### NFR Compliance

- **NFR-05 (Deployability):** `base: '/'` enables ≤5-step deploy to Vercel or AWS with Docker
- **NFR-04 (Maintainability):** `types.ts` and `constants.ts` are the single sources of truth — prevents inconsistency across all future modules

### Project Structure Notes

- `src/types.ts` and `src/constants.ts` live directly in `src/` — not in a `src/shared/` subdirectory (no nested structure in v1)
- Test files are co-located with components — no `__tests__/` directory (enforced in architecture)
- No barrel `index.ts` files — import directly from source files

### References

- Scaffold command: [Source: architecture.md#Implementation Handoff]
- vite.config.ts pattern: [Source: architecture.md#Starter Template Evaluation]
- Task interface canonical shape: [Source: architecture.md#Format Patterns]
- STORAGE_KEY convention: [Source: architecture.md#Format Patterns → localStorage Contract]
- Anti-patterns: [Source: architecture.md#Enforcement Guidelines]
- Deployment target (base: '/'): [Source: architecture.md#Infrastructure & Deployment]
- Project structure: [Source: architecture.md#Project Structure & Boundaries]
- AR-01 (scaffold requirement): [Source: epics.md#Additional Requirements]
- AR-10 (types.ts + constants.ts): [Source: epics.md#Additional Requirements]
- Story 1.1 ACs: [Source: epics.md#Story 1.1: Project Scaffold & Core Configuration]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Scaffolded via temp dir (`/tmp/donezo-scaffold`) then copied to project root — `npm create vite@latest .` was cancelled due to non-empty directory prompt
- Vite 9 template (create-vite@9.0.3) used — newer than expected 8.x (actual Vite runtime is 8.0.3 matching architecture spec)
- Template name was `donezo-scaffold` — corrected to `donezo` in package.json
- `index.css` cleared of Vite theme variables (would conflict with Tailwind preflight)

### Completion Notes List

- ✅ Project scaffolded with react-ts template, Vite 8.0.3 runtime
- ✅ All dependencies installed: tailwindcss@4.x, @tailwindcss/vite, zustand@5.x, vitest@4.x, RTL, Playwright, @axe-core/playwright
- ✅ Playwright browsers downloaded (Chrome, Firefox, WebKit)
- ✅ vite.config.ts: base:'/' + @tailwindcss/vite plugin configured
- ✅ src/types.ts: canonical Task interface with FR-10 extensibility comment
- ✅ src/constants.ts: STORAGE_KEY = 'donezo_tasks'
- ✅ tsconfig.app.json: "strict": true confirmed present
- ✅ App.css: @import "tailwindcss" only (Tailwind v4 pattern)
- ✅ App.tsx: minimal shell with text-blue-500 class confirming Tailwind utility rendering
- ✅ npm run build: zero TypeScript errors, 17 modules, CSS generated
- ✅ npm run dev: localhost:5173 responds successfully

### File List

- `package.json` (modified — name corrected to "donezo", all deps added)
- `vite.config.ts` (modified — base:'/', @tailwindcss/vite plugin added)
- `src/App.tsx` (modified — Vite boilerplate replaced with minimal Donezo shell)
- `src/App.css` (modified — Vite defaults replaced with @import "tailwindcss")
- `src/index.css` (modified — Vite theme variables cleared)
- `src/types.ts` (created — canonical Task interface)
- `src/constants.ts` (created — STORAGE_KEY)
- `node_modules/` (created by npm install — not tracked in git)
- `dist/` (created by npm run build — not tracked in git)
