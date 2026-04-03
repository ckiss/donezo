# Story 3.2: Loading State

Status: done

## Story

As a user,
I want to see a loading indicator while the app is hydrating my saved tasks,
so that I know the app is working and my data is on the way.

## Acceptance Criteria

1. Given the app is loading and Zustand `persist` middleware is rehydrating from localStorage, a loading indicator is visible in place of the task list
2. The loading state is managed via the `onRehydrateStorage` callback in the store (not a timer)
3. Once hydration completes, the task list (or empty state) renders immediately
4. The loading indicator does not flash on fast devices — since localStorage is synchronous, hydration is near-instant; the loading state will only show if rehydration is genuinely slow
5. Component tests cover the loading state render in `TaskList.test.tsx`

## Tasks / Subtasks

- [x] Task 1: Add `isHydrated` flag to the store (AC: 2)
  - [x] Add `isHydrated: boolean` to the `TaskStore` interface (initial: `false`)
  - [x] Use `persist.onFinishHydration` API to set `isHydrated: true` after rehydration (more reliable than `onRehydrateStorage` callback which had timing issues with `useTaskStore` reference)
  - [x] Added `partialize` to exclude `isHydrated` from localStorage persistence
  - [x] Export `isHydrated` via the store selector pattern
  - [x] Confirm file does not exceed 150 lines (70 lines)

- [x] Task 2: Update `TaskList.tsx` to show loading state (AC: 1, 3)
  - [x] Read `isHydrated` from store via `useTaskStore((s) => s.isHydrated)`
  - [x] When `!isHydrated`, render "Loading..." indicator
  - [x] When `isHydrated && tasks.length === 0`, render empty state (existing)
  - [x] When `isHydrated && tasks.length > 0`, render task list (existing)
  - [x] Confirm file does not exceed 150 lines (32 lines)

- [x] Task 3: Update unit tests (AC: 5)
  - [x] Added loading state test in `TaskList.test.tsx`: when `isHydrated` is false, "Loading..." is shown
  - [x] Updated `beforeEach` in `TaskList.test.tsx`, `TaskItem.test.tsx`, `TaskInput.test.tsx`, `useTaskStore.test.ts` to set `isHydrated: true`
  - [x] Run `npm run test:run` — 28/28 tests pass, no regressions

- [x] Task 4: Full regression run
  - [x] Run `npm run test:run` — 28/28 unit/integration tests pass
  - [x] Run `npx playwright test` — 33/33 E2E tests pass across 3 browsers
  - [x] Run `npm run build` — zero TypeScript errors

### Senior Developer Review (AI)

**Review Date:** 2026-04-03
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Approved with patches (2 patches, 2 deferred)

#### Review Findings

- [x] [Review][Patch] TaskInput is interactive before hydration — practically unreachable (localStorage is synchronous, `hasHydrated()` true at module load). No code change needed; noted for awareness.
- [x] [Review][Patch] Added transition test: `isHydrated` false→true verifies component re-renders from loading to empty state [src/components/TaskList.test.tsx]
- [x] [Review][Defer] If hydration fails, `isHydrated` stays false and UI shows permanent "Loading..." — deferred, Story 3.3 scope (error recovery)
- [x] [Review][Defer] No timeout/error fallback for stuck loading state — deferred, Story 3.3 scope (error boundary)

## Dev Notes

### Zustand Persist `onRehydrateStorage` API

The `persist` middleware config accepts an `onRehydrateStorage` callback. It returns a function that is called when rehydration finishes.

```ts
persist(
  (set) => ({
    tasks: [],
    isHydrated: false,
    // ... actions
  }),
  {
    name: STORAGE_KEY,
    onRehydrateStorage: () => {
      // Called when rehydration starts (optional setup)
      return (state, error) => {
        // Called when rehydration finishes
        if (!error) {
          useTaskStore.setState({ isHydrated: true })
        }
      }
    },
  }
)
```

**Important:** `onRehydrateStorage` returns a **callback** — the outer function runs when rehydration starts, the returned inner function runs when it finishes. Use the inner function to set `isHydrated: true`.

**Alternative pattern** (simpler, also valid in Zustand 5.x):

```ts
onRehydrateStorage: () => () => {
  useTaskStore.setState({ isHydrated: true })
},
```

### Store Changes

```ts
interface TaskStore {
  tasks: Task[]
  isHydrated: boolean  // ← NEW
  addTask: (text: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      isHydrated: false,  // ← NEW — false until rehydration complete
      // ... existing actions unchanged
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => () => {
        useTaskStore.setState({ isHydrated: true })  // ← NEW
      },
      // Story 3.3 will extend with: hasError flag for storage failure surfacing
    }
  )
)
```

**Critical:** `isHydrated` should NOT be persisted to localStorage. Zustand persist by default persists the entire state. Use `partialize` to exclude it:

```ts
{
  name: STORAGE_KEY,
  partialize: (state) => ({ tasks: state.tasks }),
  onRehydrateStorage: () => () => {
    useTaskStore.setState({ isHydrated: true })
  },
}
```

### TaskList.tsx Changes

```tsx
export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)
  const isHydrated = useTaskStore((s) => s.isHydrated)

  if (!isHydrated) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No tasks yet</p>
        <p className="mt-1 text-xs text-gray-400">Add your first task above</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}
```

### Test Considerations

**Critical:** Adding `isHydrated: false` as default store state will break ALL existing tests that render `<TaskList />` because they'll now see "Loading..." instead of the expected content.

**Fix:** Update `beforeEach` in ALL test files that render components reading from the store to set `isHydrated: true`:

```ts
beforeEach(() => {
  useTaskStore.setState({ tasks: [], isHydrated: true })
  localStorage.clear()
})
```

**Affected test files:**
- `src/components/TaskList.test.tsx` — renders `<TaskList />`
- `src/components/TaskItem.test.tsx` — renders `<TaskList />`
- `src/components/TaskInput.test.tsx` — renders `<TaskInput />` (does NOT read isHydrated, but reset pattern should be consistent)

**Loading state test:**

```tsx
it('renders loading indicator when store is not hydrated', () => {
  useTaskStore.setState({ tasks: [], isHydrated: false })
  render(<TaskList />)
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  expect(screen.queryByText('No tasks yet')).toBeNull()
  expect(screen.queryByRole('list')).toBeNull()
})
```

### Architecture Constraints (MUST follow)

| Rule | Detail |
|---|---|
| Store modified | `src/store/useTaskStore.ts` — add `isHydrated`, `onRehydrateStorage`, `partialize` |
| Component modified | `src/components/TaskList.tsx` — add loading state branch |
| Tests modified | `src/components/TaskList.test.tsx`, potentially `TaskItem.test.tsx` |
| No separate loading component | Loading indicator inline in TaskList |
| No timer-based loading | Use `onRehydrateStorage` callback only |
| `isHydrated` not persisted | Use `partialize` to exclude from localStorage |
| Line limit | ≤ 150 lines per file |
| Zustand 5.x pattern | `create<T>()(persist(...))` — double parentheses |

### Anti-Patterns — Explicitly Forbidden

```tsx
// ❌ Never use a timer/setTimeout for loading state
setTimeout(() => setIsLoading(false), 1000)

// ❌ Never create a separate LoadingSpinner component
import { LoadingSpinner } from './LoadingSpinner'

// ❌ Never use React Suspense for this — Zustand persist is not Suspense-aware
<Suspense fallback={<Loading />}><TaskList /></Suspense>

// ❌ Never hold isHydrated in component local state
const [isHydrated, setIsHydrated] = useState(false)

// ❌ Never persist isHydrated to localStorage
// If isHydrated is persisted, it will be true on reload BEFORE rehydration finishes

// ❌ Never forget to update beforeEach in existing tests
// isHydrated defaults to false — all existing tests will break without the fix
```

### Previous Story Intelligence

- Store at `src/store/useTaskStore.ts` (59 lines) — line 55 has comment: "Story 3.2 will extend with: onRehydrateStorage for isHydrated flag"
- `TaskList.tsx` (23 lines) — has empty state and task list branches; loading state goes BEFORE empty state check
- Node.js v25 localStorage mock in `test-setup.ts` — no additional test infra needed
- Zustand 5.x with `create<T>()(persist(...))` pattern
- All test files use `useTaskStore.setState({ tasks: [] })` + `localStorage.clear()` in beforeEach — must update to include `isHydrated: true`
- 27/27 unit tests, 33/33 E2E tests passing at start of this story
- `npm run build` clean

### Project Structure After This Story

```
src/
  components/
    TaskInput.tsx              ← unchanged
    TaskInput.test.tsx         ← MODIFIED (beforeEach: isHydrated: true)
    TaskItem.tsx               ← unchanged
    TaskItem.test.tsx          ← MODIFIED (beforeEach: isHydrated: true)
    TaskList.tsx               ← MODIFIED — loading state branch added
    TaskList.test.tsx          ← MODIFIED — loading state test + beforeEach update
  store/
    useTaskStore.ts            ← MODIFIED — isHydrated, onRehydrateStorage, partialize
    useTaskStore.test.ts       ← MODIFIED (beforeEach: isHydrated: true, new tests)
  App.tsx                      ← unchanged
```

### References

- Story 3.2 ACs: [Source: epics.md#Story 3.2: Loading State]
- FR-07 (loading state during hydration): [Source: epics.md#Functional Requirements]
- Zustand persist onRehydrateStorage: [Source: architecture.md, useTaskStore.ts:55]
- Store shape: [Source: src/store/useTaskStore.ts]
- TaskList current impl: [Source: src/components/TaskList.tsx]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **Blocker: `onRehydrateStorage` callback timing issue.** Initial implementation used `onRehydrateStorage: () => () => { useTaskStore.setState({ isHydrated: true }) }` per the story spec. This worked in unit tests (where `isHydrated` is manually set) but failed in E2E — the app was stuck on "Loading..." because the callback referencing `useTaskStore` had a timing issue during module initialization. **Fix:** Replaced with `useTaskStore.persist.onFinishHydration()` + `useTaskStore.persist.hasHydrated()` check after store creation. This reliably sets `isHydrated: true` in both unit and E2E environments.

### Completion Notes List

- ✅ Added `isHydrated: boolean` to `TaskStore` interface and initial state (default: `false`)
- ✅ Added `partialize: (state) => ({ tasks: state.tasks })` to exclude `isHydrated` from localStorage
- ✅ Used `persist.onFinishHydration` + `persist.hasHydrated()` to set `isHydrated: true` after rehydration
- ✅ Updated `TaskList.tsx` (32 lines) — loading state → empty state → task list three-branch render
- ✅ Added loading state test in `TaskList.test.tsx`
- ✅ Updated `beforeEach` in 4 test files to include `isHydrated: true`
- ✅ Full regression: 28/28 unit tests, 33/33 E2E tests, build clean

### File List

- `src/store/useTaskStore.ts` (modified — isHydrated flag, partialize, onFinishHydration)
- `src/components/TaskList.tsx` (modified — loading state branch)
- `src/components/TaskList.test.tsx` (modified — loading state test, beforeEach update)
- `src/components/TaskItem.test.tsx` (modified — beforeEach: isHydrated: true)
- `src/components/TaskInput.test.tsx` (modified — beforeEach: isHydrated: true)
- `src/store/useTaskStore.test.ts` (modified — beforeEach: isHydrated: true)
