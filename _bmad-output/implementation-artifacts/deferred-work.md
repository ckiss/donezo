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
