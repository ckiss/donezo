# Story 2.1: Zustand Store & Persistence

Status: done

## Story

As a developer,
I want a Zustand store with `persist` middleware wired to localStorage,
so that all task state is managed centrally and automatically persists across browser sessions.

## Acceptance Criteria

1. `useTaskStore` exports `tasks`, `addTask`, `toggleTask`, and `deleteTask`
2. `addTask(text)` creates a task with `crypto.randomUUID()` id, trimmed text, `completed: false`, and `Date.now()` createdAt — rejects empty/whitespace-only text
3. `toggleTask(id)` flips the `completed` boolean for the matching task
4. `deleteTask(id)` removes the matching task from the array
5. The store is persisted to `localStorage` under the key `donezo_tasks` via Zustand `persist` middleware
6. Closing and reopening the browser restores the task list from localStorage
7. The store lives in `src/store/useTaskStore.ts` and does not exceed 150 lines
8. All store actions have unit tests in `src/store/useTaskStore.test.ts`

## Tasks / Subtasks

- [x] Task 1: Create `src/store/` directory and `useTaskStore.ts` (AC: 1, 2, 3, 4, 5, 7)
  - [x] Create `src/store/useTaskStore.ts`
  - [x] Define `TaskStore` interface with `tasks`, `addTask`, `toggleTask`, `deleteTask`
  - [x] Implement store using Zustand 5.x double-parentheses pattern: `create<TaskStore>()(persist(...))`
  - [x] Wire `persist` middleware with `name: STORAGE_KEY` from `constants.ts`
  - [x] Implement `addTask`: trim text, guard empty/whitespace, push with `crypto.randomUUID()` + `Date.now()`
  - [x] Implement `toggleTask`: immutable map — spread task, flip `completed`
  - [x] Implement `deleteTask`: immutable filter — exclude matching id
  - [x] Confirm file does not exceed 150 lines (59 lines)

- [x] Task 2: Write unit tests in `src/store/useTaskStore.test.ts` (AC: 8)
  - [x] Reset store and clear localStorage in `beforeEach`
  - [x] Test `addTask` — valid text creates task with correct shape (id, text, completed: false, createdAt)
  - [x] Test `addTask` — empty string does nothing
  - [x] Test `addTask` — whitespace-only string does nothing
  - [x] Test `addTask` — text is trimmed before storage
  - [x] Test `toggleTask` — flips `completed` from false → true → false
  - [x] Test `deleteTask` — removes task, others remain
  - [x] Test localStorage persistence — after `addTask`, `localStorage.getItem(STORAGE_KEY)` contains the task
  - [x] Run `npm run test:run` and confirm all tests pass (12/12 pass)

- [x] Task 3: Verify persistence across reload (AC: 5, 6)
  - [x] Persistence confirmed via unit test: after `addTask`, localStorage contains task at `donezo_tasks` key
  - [x] `npm run build` passes with zero TypeScript errors — store module included in bundle

### Senior Developer Review (AI)

**Review Date:** 2026-04-02
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Approved (0 patches, 4 deferred)

#### Review Findings

- [x] [Review][Defer] No input length limit on `addTask` text [src/store/useTaskStore.ts:21] — deferred, spec imposes no max length; enhancement for Story 3.3 error hardening
- [x] [Review][Defer] No rehydration test (pre-populated localStorage → store) [src/store/useTaskStore.test.ts] — deferred, AC-8 covers "store actions" unit tests; rehydration is middleware behavior verified E2E in Story 2.4
- [x] [Review][Defer] No guard against corrupt localStorage data on rehydration [src/store/useTaskStore.ts:53] — deferred, explicitly Story 3.3 scope (`hasError` flag + `onRehydrateStorage`)
- [x] [Review][Defer] No handling of `QuotaExceededError` on localStorage write [src/store/useTaskStore.ts:53] — deferred, Story 3.3 scope (error recovery without page reload)

## Dev Notes

### CRITICAL: Zustand 5.x TypeScript Pattern

Zustand 5.0.12 is installed. Use the **double-parentheses** pattern — required for TypeScript generics:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useTaskStore = create<TaskStore>()(
  persist(stateCreator, options)
)
```

**Do NOT use** the single-call pattern `create<TaskStore>(stateCreator)` — this was Zustand v3 and will cause TypeScript errors.

### Required: `src/store/useTaskStore.ts` (canonical implementation)

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task } from '../types'
import { STORAGE_KEY } from '../constants'

interface TaskStore {
  tasks: Task[]
  addTask: (text: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
}

// All task state lives here. No component should hold task state locally.
// To support multi-user in v2: add userId to addTask and filter by user context.
export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (text: string) => {
        const trimmed = text.trim()
        if (!trimmed) return // guard: reject empty/whitespace (AR-02, epics Story 2.1 AC-2)
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: crypto.randomUUID(),
              text: trimmed,
              completed: false,
              createdAt: Date.now(),
            },
          ],
        }))
      },

      toggleTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        }))
      },

      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },
    }),
    {
      name: STORAGE_KEY, // always import from constants.ts — never hardcode 'donezo_tasks'
    }
  )
)
```

### Required: `src/store/useTaskStore.test.ts` (testing pattern)

Use `useTaskStore.getState()` and `useTaskStore.setState()` directly — **no React rendering needed** for store tests:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTaskStore } from './useTaskStore'
import { STORAGE_KEY } from '../constants'

beforeEach(() => {
  // Reset store state and localStorage between tests
  useTaskStore.setState({ tasks: [] })
  localStorage.clear()
})

describe('addTask', () => {
  it('creates a task with correct shape', () => {
    useTaskStore.getState().addTask('Buy milk')
    const { tasks } = useTaskStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({
      text: 'Buy milk',
      completed: false,
    })
    expect(tasks[0].id).toBeTruthy()
    expect(typeof tasks[0].createdAt).toBe('number')
  })

  it('rejects empty string', () => {
    useTaskStore.getState().addTask('')
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('rejects whitespace-only string', () => {
    useTaskStore.getState().addTask('   ')
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('trims text before storage', () => {
    useTaskStore.getState().addTask('  Walk dog  ')
    expect(useTaskStore.getState().tasks[0].text).toBe('Walk dog')
  })
})

describe('toggleTask', () => {
  it('flips completed state', () => {
    useTaskStore.getState().addTask('Test task')
    const id = useTaskStore.getState().tasks[0].id
    useTaskStore.getState().toggleTask(id)
    expect(useTaskStore.getState().tasks[0].completed).toBe(true)
    useTaskStore.getState().toggleTask(id)
    expect(useTaskStore.getState().tasks[0].completed).toBe(false)
  })
})

describe('deleteTask', () => {
  it('removes the matching task', () => {
    useTaskStore.getState().addTask('Task A')
    useTaskStore.getState().addTask('Task B')
    const id = useTaskStore.getState().tasks[0].id
    useTaskStore.getState().deleteTask(id)
    const { tasks } = useTaskStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].text).toBe('Task B')
  })
})

describe('localStorage persistence', () => {
  it('writes to localStorage after addTask', () => {
    useTaskStore.getState().addTask('Persisted task')
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.state.tasks[0].text).toBe('Persisted task')
  })
})
```

**Note on localStorage test shape:** Zustand `persist` stores state as `{ state: { tasks: [...] }, version: 0 }`. Test accordingly.

### Architecture Constraints (MUST follow)

| Rule | Detail |
|---|---|
| File location | `src/store/useTaskStore.ts` — not `src/useTaskStore.ts` or elsewhere |
| Import Task | Always `import type { Task } from '../types'` — never redefine locally |
| Import STORAGE_KEY | Always `import { STORAGE_KEY } from '../constants'` — never hardcode string |
| ID generation | `crypto.randomUUID()` only — never `Math.random()` or sequential integers |
| Immutable updates | Always spread/map/filter — never mutate state directly |
| No prop drilling | Components access store directly via `useTaskStore` — no tasks passed as props |
| localStorage | Managed exclusively by `persist` — no direct `localStorage.setItem/getItem` |
| Line limit | File must stay ≤ 150 lines |

### Anti-Patterns — Explicitly Forbidden

```ts
// ❌ Never directly call localStorage
localStorage.setItem('donezo_tasks', JSON.stringify(tasks))

// ❌ Never define Task locally in store
interface Task { id: string; text: string; ... }

// ❌ Never use Math.random for IDs
id: Math.random().toString()

// ❌ Never mutate state directly
state.tasks.push(newTask)

// ❌ Never use useState in a component for tasks
const [tasks, setTasks] = useState([])
```

### Forward-Compatibility Notes (Story 3.2 & 3.3)

Story 3.2 (Loading State) will need to extend the store with `isHydrated` tracked via `onRehydrateStorage`. Story 3.3 (Error State) will add `hasError: boolean`. **Do not implement these now** — only the 4 exported members listed in AC-1. The `persist` middleware structure used here is already designed to accept these extensions without refactoring.

If you want to future-proof: the `persist` options object accepts `onRehydrateStorage` later:
```ts
{
  name: STORAGE_KEY,
  // Story 3.2 will add: onRehydrateStorage: () => (state) => { ... }
}
```

### Deferred Items from Story 1.1 Addressed Here

From `deferred-work.md`:
- `crypto.randomUUID()` secure context: localhost and HTTPS both qualify — no action needed
- No localStorage deserialization validation: Zustand `persist` silently initialises with `{ tasks: [] }` on parse error. Full `hasError` surface is Story 3.3 scope.
- `Task.text` trimming unenforced at type level: enforced here in `addTask` guard (AC-2)

### Stack Versions

| Package | Version |
|---|---|
| zustand | 5.0.12 |
| vitest | ^4.1.2 (from Story 1.2) |
| @testing-library/react | ^16.3.2 (not needed for store tests) |

### Project Structure After This Story

```
src/
  store/                     ← NEW directory created in this story
    useTaskStore.ts           ← NEW — Zustand store + persist
    useTaskStore.test.ts      ← NEW — unit tests for all actions
  types.ts                   ← unchanged (Task interface)
  constants.ts               ← unchanged (STORAGE_KEY)
  App.tsx                    ← unchanged (minimal shell from Story 1.1)
```

### References

- Store shape: [Source: architecture.md#State Management Patterns]
- Naming rules (addTask, toggleTask, deleteTask): [Source: architecture.md#Naming Patterns → Zustand Actions]
- Anti-patterns: [Source: architecture.md#Enforcement Guidelines]
- localStorage contract: [Source: architecture.md#Format Patterns → localStorage Contract]
- FR-09 (persistence): [Source: epics.md#FR-09]
- Story 2.1 ACs: [Source: epics.md#Story 2.1: Zustand Store & Persistence]
- Deferred items addressed: [Source: _bmad-output/implementation-artifacts/deferred-work.md]
- 150-line cap: [Source: architecture.md#NFR-04]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **Node.js v25 localStorage incompatibility** — Zustand 5.x `persist` middleware defaults to `() => window.localStorage`, but Node.js v25's experimental Web Storage API exposes a broken `globalThis.localStorage` (missing `setItem`) when `--localstorage-file` is not configured. Fixed by adding a proper in-memory Storage mock in `src/test-setup.ts` via `Object.defineProperty`. This applies to all test environments in this project.

### Completion Notes List

- ✅ Created `src/store/useTaskStore.ts` (59 lines, well within 150-line cap)
- ✅ Zustand 5.x double-parentheses TypeScript pattern used: `create<TaskStore>()(persist(...))`
- ✅ All 4 store exports: `tasks`, `addTask`, `toggleTask`, `deleteTask`
- ✅ `addTask` guards empty/whitespace text, trims before storage, uses `crypto.randomUUID()` + `Date.now()`
- ✅ `toggleTask` and `deleteTask` use immutable spread/map/filter patterns
- ✅ Persist middleware wired to `STORAGE_KEY` imported from `constants.ts`
- ✅ 12/12 unit tests pass in `src/store/useTaskStore.test.ts`
- ✅ localStorage persistence verified via unit test (Zustand persist stores `{ state: { tasks }, version: 0 }`)
- ✅ Fixed Node.js v25 experimental localStorage incompatibility in `src/test-setup.ts`
- ✅ Full regression suite: 13/13 tests pass, `npm run build` clean

### File List

- `src/store/useTaskStore.ts` (created — Zustand store with persist middleware)
- `src/store/useTaskStore.test.ts` (created — 12 unit tests for all store actions)
- `src/test-setup.ts` (modified — added in-memory localStorage mock for Node.js v25 compatibility)
