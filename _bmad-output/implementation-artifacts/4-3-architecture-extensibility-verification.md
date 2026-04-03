# Story 4.3: Architecture Extensibility Verification

Status: done

## Story

As a developer,
I want to verify that the data model and store are user-identity-agnostic,
so that adding authentication in v2 requires only additive changes, not a redesign.

## Acceptance Criteria

1. The `Task` interface in `src/types.ts` contains no `userId` or single-user-encoded fields
2. The Zustand store actions (`addTask`, `toggleTask`, `deleteTask`) accept only task-level parameters — no user context baked in
3. The localStorage key `donezo_tasks` is namespaced but not user-scoped (no user id in the key)
4. A code review checklist item confirms: "Adding a `userId` field to `Task` and a user context to the store is sufficient to support multi-user in v2 — no structural redesign needed"
5. This verification is documented as a comment in `src/types.ts` and `src/store/useTaskStore.ts`

## Tasks / Subtasks

- [x] Task 1: Verify `Task` interface is identity-agnostic (AC: 1)
  - [x] Confirmed: `src/types.ts` has no `userId`, `ownerId`, or user-scoped fields
  - [x] Confirmed: FR-10 extensibility comment present (lines 1-3)
  - [x] No changes needed — comment is accurate and complete

- [x] Task 2: Verify store actions are identity-agnostic (AC: 2)
  - [x] Confirmed: `addTask(text: string)` — text only, no user parameter
  - [x] Confirmed: `toggleTask(id: string)` — task id only
  - [x] Confirmed: `deleteTask(id: string)` — task id only
  - [x] Confirmed: v2 extensibility comment present (line 30)
  - [x] No changes needed — comment is accurate

- [x] Task 3: Verify localStorage key is not user-scoped (AC: 3)
  - [x] Confirmed: `STORAGE_KEY = 'donezo_tasks'` — namespaced, not user-scoped
  - [x] Confirmed: no other localStorage keys used in the app

- [x] Task 4: Document extensibility verification (AC: 4, 5)
  - [x] FR-10 comment verified in `src/types.ts` (lines 1-3)
  - [x] FR-10 comment verified in `src/store/useTaskStore.ts` (line 30)
  - [x] Architecture verification documented in Dev Agent Record below

- [x] Task 5: Full regression run
  - [x] Run `npm run test:run` — 35/35 tests pass, zero code changes
  - [x] Run `npm run build` — zero TypeScript errors

## Dev Notes

### Current State — Already Compliant

The existing codebase already satisfies all ACs for this story:

**`src/types.ts`** — Already has the extensibility comment:
```ts
// Identity-agnostic task model.
// To support multi-user in v2: add `userId: string` field and user context to the store.
// No structural redesign needed — only additive changes required (FR-10).
export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
}
```

**`src/store/useTaskStore.ts`** — Already has the extensibility comment:
```ts
// All task state lives here. No component should hold task state locally.
// To support multi-user in v2: add userId to addTask and filter by user context.
```

**`src/constants.ts`** — Key is namespaced but not user-scoped:
```ts
export const STORAGE_KEY = 'donezo_tasks'
```

**Store actions** — All accept only task-level parameters:
- `addTask(text: string)` — no user context
- `toggleTask(id: string)` — task id only
- `deleteTask(id: string)` — task id only

### What This Story Does

This is a **verification story**, not an implementation story. The dev agent should:
1. Read the relevant files and confirm the architecture is correct
2. Verify documentation comments are present and accurate
3. Update comments if they're missing or outdated (unlikely — they were added in Story 2.1)
4. Run regression tests to confirm nothing is broken
5. Document the verification in the Dev Agent Record

### No Code Changes Expected

If the existing comments and architecture are correct (which they are based on current codebase), this story requires **zero code changes**. The story is satisfied by verification and documentation.

### Architecture Constraints

| Rule | Detail |
|---|---|
| No code changes expected | This is a verification story |
| Files to verify | `src/types.ts`, `src/store/useTaskStore.ts`, `src/constants.ts` |
| Documentation | Comments already in place from Story 2.1 |
| Line limit | ≤ 150 lines per file (already compliant) |

### Previous Story Intelligence

- `types.ts` (9 lines) — FR-10 comment added in Story 1.1/2.1
- `useTaskStore.ts` (93 lines) — v2 extensibility comment added in Story 2.1
- `constants.ts` (3 lines) — `STORAGE_KEY = 'donezo_tasks'`
- 35/35 unit tests, 58+2 E2E tests passing
- `npm run build` clean

### References

- Story 4.3 ACs: [Source: epics.md#Story 4.3: Architecture Extensibility Verification]
- FR-10 (multi-user v2 without redesign): [Source: epics.md#Functional Requirements]
- Task interface: [Source: src/types.ts]
- Store: [Source: src/store/useTaskStore.ts]
- Storage key: [Source: src/constants.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- No blockers. Verification-only story — zero code changes required.

### Completion Notes List

- ✅ **FR-10 Architecture Verification Complete**
- ✅ `Task` interface (`src/types.ts`) — identity-agnostic: `id`, `text`, `completed`, `createdAt` only. No `userId` field. FR-10 comment documents v2 path: "add `userId: string` field and user context to the store."
- ✅ Store actions (`src/store/useTaskStore.ts`) — `addTask(text)`, `toggleTask(id)`, `deleteTask(id)` accept only task-level parameters. No user context baked in. Comment documents v2 path: "add userId to addTask and filter by user context."
- ✅ Storage key (`src/constants.ts`) — `STORAGE_KEY = 'donezo_tasks'` is namespaced but not user-scoped. In v2, key could become `donezo_tasks_${userId}` or store could filter by userId.
- ✅ **Checklist confirmation:** Adding a `userId: string` field to `Task` and a user context to the store is sufficient to support multi-user in v2 — no structural redesign needed. All data model fields, store actions, and persistence patterns are additive-only.
- ✅ Zero code changes — all documentation and architecture were already correct from Stories 1.1 and 2.1.
- ✅ Full regression: 35/35 unit tests pass, build clean.

### File List

- No files changed — verification-only story
