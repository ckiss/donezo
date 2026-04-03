# Deferred Work

## Deferred from: code review of 1-1-project-scaffold-and-core-configuration (2026-04-02)

- **Non-null assertion on `getElementById('root')`** [src/main.tsx:6] — Vite template default; `index.html` has `<div id="root">` so low practical risk. Could add an explicit guard for defense-in-depth.
- **`crypto.randomUUID()` requires secure context** [src/types.ts:5 comment] — Story 2.1 scope. When implementing `addTask`, ensure dev environments serve over HTTPS or localhost. Consider documenting in README.
- **No test configuration** [package.json] — Story 1.2 explicitly covers this. `npm test` will fail until vitest.config.ts and playwright.config.ts are added.
- **No input sanitization / CSP architecture** — Story 1.4 scope; AR-11 security audit covers this before first deploy.
- **`Task.text` trimming unenforced at type level** [src/types.ts:6] — Intentional; enforced in `addTask` store action (Story 2.1). Comment on the interface serves as the contract.
- **No localStorage deserialization validation** [src/constants.ts] — Story 2.1 scope; Zustand `onRehydrateStorage` callback should catch malformed data and set `hasError` flag.
- **`erasableSyntaxOnly: true` undocumented** [tsconfig.app.json] — TypeScript 5.9 option that forbids `enum`/`namespace`. Consider adding a comment in tsconfig for contributor awareness.

## Deferred from: code review of 1-2-testing-infrastructure-setup (2026-04-02)

- **No test-specific tsconfig for `src/` test files** [tsconfig.app.json:28] — Test files excluded from build tsconfig (fix for TS2593) but no separate `tsconfig.test.json` means type errors in test files are invisible to tsc and most IDEs. Caused by Story 1.1 decision. Address when test complexity warrants it.
- **No tsconfig for `e2e/` directory** [e2e/] — Playwright TS files outside `src/` include path have no compiler config. TypeScript errors in e2e specs are silent. Low risk for current smoke tests; address if e2e tests grow complex.
- **`baseURL` hardcoded in two places** [e2e/playwright.config.ts:11,21] — `use.baseURL` and `webServer.url` both hardcode `http://localhost:5173`. Minor maintenance risk if port changes. Extract to a `const BASE_URL` if port changes become frequent.

## Deferred from: code review of 2-1-zustand-store-and-persistence (2026-04-02)

- **No input length limit on `addTask` text** [src/store/useTaskStore.ts:21] — Spec imposes no max length; a caller can pass arbitrarily long text. Enhancement for Story 3.3 error hardening or a future max-length guard.
- **No rehydration test (pre-populated localStorage → store)** [src/store/useTaskStore.test.ts] — Unit tests cover the write path; rehydration (read path) is Zustand middleware behavior best tested E2E in Story 2.4.
- **No guard against corrupt localStorage data on rehydration** [src/store/useTaskStore.ts:53] — Story 3.3 scope: `hasError` flag + `onRehydrateStorage` callback for malformed data detection.
- **No handling of `QuotaExceededError` on localStorage write** [src/store/useTaskStore.ts:53] — Story 3.3 scope: error recovery without page reload (NFR-03).

## Deferred from: code review of 2-2-task-input-component (2026-04-02)

- **`autoFocus` may disrupt screen reader users** [src/components/TaskInput.tsx:26] — Story 4.2 (Accessibility) scope: evaluate whether autoFocus should be conditional or replaced with a programmatic focus strategy.
- **No accessible feedback when empty submit is rejected** [src/components/TaskInput.tsx:12] — Story 4.2 (Accessibility) scope: add aria-live region or aria-invalid + aria-describedby for screen reader feedback on validation failure.

## Deferred from: code review of 2-3-task-list-and-task-item-components (2026-04-03)

- **`createdAt` could render "Invalid Date" from corrupted localStorage** [src/components/TaskItem.tsx:13] — Story 3.3 scope: `onRehydrateStorage` callback should validate `createdAt` is a valid number.
- **Extremely long task text causes layout overflow** [src/components/TaskItem.tsx:20-23] — Story 3.3/4.1 scope: no input length limit; `flex-1` span has no `overflow-hidden` or `truncate` for unbounded text.
- **Duplicate task IDs from corrupted localStorage cause React key collision** [src/components/TaskList.tsx:12] — Story 3.3 scope: rehydration should validate ID uniqueness.
- **Delete button has no confirmation dialog** [src/components/TaskItem.tsx:28] — Story 2.4 scope: delete interaction design may want undo or confirmation.

## Deferred from: code review of 2-4-complete-and-delete-task-interactions (2026-04-03)

- **Aria-label regex doesn't verify label flips between "complete"/"incomplete" after toggle** — Story 4.2 (Accessibility) scope: E2E and RTL tests should assert that `aria-label` dynamically reflects current state.

## Deferred from: code review of 3-2-loading-state (2026-04-03)

- **If hydration fails, `isHydrated` stays false and UI shows permanent "Loading..."** — Story 3.3 scope: `onRehydrateStorage` error callback or `onFinishHydration` should handle failures and set a `hasError` flag.
- **No timeout/error fallback for stuck loading state** — Story 3.3 scope: error boundary should catch and surface stuck hydration as a recoverable error.

## Deferred from: code review of 3-3-error-boundary-and-error-state (2026-04-03)

- **`clearError` only dismisses UI warning, doesn't resolve persistence failure** — Future enhancement: re-surface `hasError` on subsequent write failures; consider retry-storage or export-data action.

## Deferred from: code review of 4-1-responsive-layout (2026-04-03)

- **Duplicated timestamp spans — screen readers announce date twice** [src/components/TaskItem.tsx:27,29] — Story 4.2 (Accessibility) scope: add `aria-hidden="true"` to one of the duplicate timestamp spans.
- **Delete button touch target may be under 44px horizontally** [src/components/TaskItem.tsx:32] — Story 4.2 (WCAG 2.5.8) scope: increase `px-2` to `px-3` or add `min-w-[44px]`.
