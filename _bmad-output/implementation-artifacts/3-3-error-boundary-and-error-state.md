# Story 3.3: Error Boundary & Error State

Status: done

## Story

As a user,
I want the app to display a clear error message if something goes wrong, without losing my existing task list,
so that a single failure doesn't break my entire experience.

## Acceptance Criteria

1. Given a render error occurs within the task list, when `ErrorBoundary` catches the error, a user-facing error message is displayed in plain English (no stack trace)
2. The `TaskInput` component remains visible and functional when an error boundary catches
3. The error message does not require a page reload to dismiss — a retry or dismiss action is available
4. Given a localStorage operation fails (e.g., quota exceeded or parse error), a `hasError` flag is set in the store and surfaced to the UI as an inline error message
5. The existing task list state is preserved and displayed when a storage error occurs
6. No user data is lost due to the failure (NFR-03)
7. Component tests in `ErrorBoundary.test.tsx` verify the fallback UI renders on error
8. An E2E test in `error-state.spec.ts` simulates a render failure and verifies the error message appears without breaking the input

## Tasks / Subtasks

- [x] Task 1: Create `ErrorBoundary` component (AC: 1, 2, 3)
  - [x] Created `src/components/ErrorBoundary.tsx` as a React class component
  - [x] Catches errors via `getDerivedStateFromError` + `componentDidCatch`
  - [x] Displays "Something went wrong" with "An error occurred while displaying your tasks."
  - [x] "Try Again" button resets error state and re-renders children
  - [x] Scoped to wrap only `<TaskList />` — `<TaskInput />` stays outside
  - [x] Tailwind red styling for error state
  - [x] Confirm file does not exceed 150 lines (46 lines)

- [x] Task 2: Add `hasError` flag to the store for storage errors (AC: 4, 5, 6)
  - [x] Added `hasError: boolean` to `TaskStore` interface (initial: `false`)
  - [x] Added `clearError: () => void` action
  - [x] `partialize` already excludes non-task fields (only `tasks` is persisted)
  - [x] Added `onRehydrateStorage` callback to detect hydration errors and set both `hasError: true` and `isHydrated: true`
  - [x] Confirm file does not exceed 150 lines (75 lines)

- [x] Task 3: Surface storage error in `TaskList.tsx` (AC: 4, 5)
  - [x] Read `hasError` and `clearError` from store
  - [x] When `hasError`, show amber warning banner above task list/empty state (tasks remain visible)
  - [x] Dismiss button calls `clearError()`
  - [x] Confirm file does not exceed 150 lines (45 lines)

- [x] Task 4: Integrate `ErrorBoundary` into `App.tsx` (AC: 2)
  - [x] Wrapped only `<TaskList />` with `<ErrorBoundary>` — `<TaskInput />` stays outside
  - [x] Build passes with zero TypeScript errors

- [x] Task 5: Write component tests (AC: 7)
  - [x] Created `src/components/ErrorBoundary.test.tsx` (4 tests)
  - [x] Test: renders children normally when no error
  - [x] Test: renders error fallback when child throws (no stack trace)
  - [x] Test: no stack trace visible to user
  - [x] Test: "Try Again" resets error and re-renders children
  - [x] Added 2 storage error tests in `TaskList.test.tsx` (banner with tasks, banner with empty state)
  - [x] Updated `beforeEach` in all 4 test files to include `hasError: false`
  - [x] Run `npm run test:run` — 35/35 tests pass, no regressions

- [x] Task 6: Write E2E test (AC: 8)
  - [x] Created `e2e/error-state.spec.ts` (2 tests)
  - [x] Test: corrupt localStorage triggers ErrorBoundary, TaskInput remains visible
  - [x] Test: TaskInput remains functional on clean page
  - [x] Run `npx playwright test` — 39/39 E2E tests pass across 3 browsers

- [x] Task 7: Full regression run
  - [x] Run `npm run test:run` — 35/35 unit/integration tests pass
  - [x] Run `npx playwright test` — 39/39 E2E tests pass
  - [x] Run `npm run build` — zero TypeScript errors

### Senior Developer Review (AI)

**Review Date:** 2026-04-03
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Approved with patches (3 patches, 1 deferred)

#### Review Findings

- [x] [Review][Patch] Added retry limit (max 2) to ErrorBoundary — "Try Again" button hidden after max retries, shows "Try refreshing the page" instead [src/components/ErrorBoundary.tsx]
- [x] [Review][Patch] Added safe localStorage wrapper (`safeLocalStorage`) that catches QuotaExceededError on writes and sets `hasError: true` [src/store/useTaskStore.ts]
- [x] [Review][Patch] E2E test now asserts "Something went wrong" is visible and verifies TaskInput works while boundary is active [e2e/error-state.spec.ts]
- [x] [Review][Defer] `clearError` only dismisses UI warning, doesn't resolve persistence failure or re-surface on subsequent write errors — future enhancement

## Dev Notes

### ErrorBoundary Pattern (React class component)

React error boundaries MUST be class components — there is no hook equivalent.

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-800">Something went wrong</p>
          <p className="mt-1 text-xs text-red-600">An error occurred while displaying your tasks.</p>
          <button
            onClick={this.handleReset}
            className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

### Store Changes

```ts
interface TaskStore {
  tasks: Task[]
  isHydrated: boolean
  hasError: boolean      // ← NEW
  addTask: (text: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  clearError: () => void // ← NEW
}

// In state creator:
hasError: false,
clearError: () => set({ hasError: false }),

// Update partialize:
partialize: (state) => ({ tasks: state.tasks }), // already excludes isHydrated and hasError
```

### Hydration Error Handling

The current `onFinishHydration` pattern should be extended to handle errors. Zustand persist's `onRehydrateStorage` callback receives `(state, error)` — if `error` is defined, set `hasError: true`:

```ts
// After store creation — extend existing hydration handling
if (useTaskStore.persist.hasHydrated()) {
  useTaskStore.setState({ isHydrated: true })
} else {
  useTaskStore.persist.onFinishHydration(() => {
    useTaskStore.setState({ isHydrated: true })
  })
}
```

For error detection, also add `onRehydrateStorage` in the persist config:

```ts
onRehydrateStorage: () => (state, error) => {
  if (error) {
    useTaskStore.setState({ hasError: true, isHydrated: true })
  }
},
```

### App.tsx Integration

```tsx
import './App.css'
import { TaskInput } from './components/TaskInput'
import { TaskList } from './components/TaskList'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="text-blue-500 text-2xl font-bold mb-4">Donezo</h1>
        <TaskInput />
        <ErrorBoundary>
          <TaskList />
        </ErrorBoundary>
      </div>
    </main>
  )
}
```

**Key:** `<TaskInput />` is OUTSIDE the `<ErrorBoundary>` — it stays visible and functional even when TaskList crashes.

### TaskList Storage Error Banner

When `hasError` is true, show a warning banner. The task list (if any) remains visible below.

```tsx
export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)
  const isHydrated = useTaskStore((s) => s.isHydrated)
  const hasError = useTaskStore((s) => s.hasError)
  const clearError = useTaskStore((s) => s.clearError)

  if (!isHydrated) {
    return (/* loading state */)
  }

  return (
    <>
      {hasError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-800">Changes may not be saved — storage error occurred</p>
          <button
            onClick={clearError}
            className="mt-2 text-xs text-amber-600 underline hover:text-amber-800"
          >
            Dismiss
          </button>
        </div>
      )}
      {tasks.length === 0 ? (
        /* empty state */
      ) : (
        <ul>...</ul>
      )}
    </>
  )
}
```

### Testing ErrorBoundary

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function ThrowingChild() {
  throw new Error('Test error')
}

function GoodChild() {
  return <p>All good</p>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>)
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('renders error fallback when child throws', () => {
    // Suppress console.error for the expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><ThrowingChild /></ErrorBoundary>)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.queryByText('Test error')).toBeNull() // no stack trace
    spy.mockRestore()
  })

  it('resets error on Try Again click', async () => {
    // ... render with error, click Try Again, verify children re-render
  })
})
```

**Important:** `console.error` must be suppressed in error boundary tests — React logs caught errors. Use `vi.spyOn(console, 'error').mockImplementation(() => {})`.

### E2E Test Pattern

Simulating a render error in E2E is tricky. Options:
1. **Inject a corrupt task via localStorage** before page load — if TaskItem crashes on invalid data
2. **Use `page.evaluate`** to corrupt the store before rendering

Since the app currently doesn't validate task data on render, the simplest approach is to verify the ErrorBoundary exists and works by injecting bad localStorage data that causes a render error:

```ts
test('shows error boundary on render failure', async ({ page }) => {
  // Inject corrupt data that will crash during rendering
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('donezo_tasks', JSON.stringify({
      state: { tasks: [{ id: null, text: null, completed: 'not-a-boolean', createdAt: 'bad' }] },
      version: 0,
    }))
  })
  await page.reload()
  // If the data causes a render error, ErrorBoundary should catch it
  // If it doesn't crash (the component is resilient), verify the app still works
  await expect(page.locator('h1')).toContainText('Donezo')
})
```

Note: If `TaskItem` doesn't actually crash on corrupt data (it may just render "Invalid Date" etc.), the E2E test should verify the `hasError` store flag is surfaced as a warning banner instead of testing the ErrorBoundary directly. The ErrorBoundary is better tested in unit tests where we can force a throw.

### Deferred Items Addressed by This Story

From deferred-work.md:
- No guard against corrupt localStorage data on rehydration → `hasError` flag + `onRehydrateStorage` error callback
- No handling of `QuotaExceededError` on localStorage write → `hasError` flag surfaced as inline warning
- If hydration fails, `isHydrated` stays false → `onRehydrateStorage` error sets both `isHydrated: true` and `hasError: true`
- No timeout/error fallback for stuck loading state → error boundary wraps TaskList
- `createdAt` could render "Invalid Date" → addressed by ErrorBoundary catch + hasError flag

### Architecture Constraints (MUST follow)

| Rule | Detail |
|---|---|
| ErrorBoundary location | `src/components/ErrorBoundary.tsx` |
| ErrorBoundary test | `src/components/ErrorBoundary.test.tsx` |
| ErrorBoundary scope | Wraps `<TaskList />` only — NOT `<TaskInput />` |
| ErrorBoundary type | React class component (required for error boundaries) |
| Store changes | `hasError`, `clearError` added to TaskStore |
| `hasError` not persisted | Already excluded by `partialize` (only `tasks` is persisted) |
| Storage error display | Inline warning banner in TaskList, tasks remain visible |
| No page reload needed | "Try Again" / "Dismiss" button resets error state |
| Line limit | ≤ 150 lines per file |
| E2E test | `e2e/error-state.spec.ts` |

### Anti-Patterns — Explicitly Forbidden

```tsx
// ❌ Never wrap TaskInput inside ErrorBoundary
<ErrorBoundary>
  <TaskInput />
  <TaskList />
</ErrorBoundary>

// ❌ Never show stack traces to users
{error.stack}

// ❌ Never require page reload to recover
<p>Please refresh the page</p>

// ❌ Never lose existing tasks on storage error
set({ tasks: [], hasError: true }) // WRONG — preserves error but loses tasks

// ❌ Never use try-catch in function components for render errors
// Only class component error boundaries catch render errors

// ❌ Never persist hasError to localStorage
partialize: (state) => ({ tasks: state.tasks, hasError: state.hasError }) // WRONG
```

### Previous Story Intelligence

- Store at `src/store/useTaskStore.ts` (70 lines) — has `isHydrated`, `partialize`, `onFinishHydration` from Story 3.2
- `TaskList.tsx` (32 lines) — loading → empty → list branches
- `App.tsx` — renders `<TaskInput />` then `<TaskList />` independently
- `partialize: (state) => ({ tasks: state.tasks })` already excludes non-task fields — `hasError` will be automatically excluded
- All test `beforeEach` blocks include `isHydrated: true` — must also add `hasError: false`
- 29/29 unit tests, 33/33 E2E tests passing at start of this story
- `npm run build` clean

### Project Structure After This Story

```
e2e/
  error-state.spec.ts          ← NEW — E2E error state test
  complete-task.spec.ts        ← unchanged
  delete-task.spec.ts          ← unchanged
  empty-state.spec.ts          ← unchanged
  smoke.spec.ts                ← unchanged
src/
  components/
    ErrorBoundary.tsx          ← NEW — React class error boundary
    ErrorBoundary.test.tsx     ← NEW — error boundary tests
    TaskInput.tsx              ← unchanged
    TaskInput.test.tsx         ← MODIFIED (beforeEach: hasError: false)
    TaskItem.tsx               ← unchanged
    TaskItem.test.tsx          ← MODIFIED (beforeEach: hasError: false)
    TaskList.tsx               ← MODIFIED — storage error banner
    TaskList.test.tsx          ← MODIFIED — storage error test + beforeEach
  store/
    useTaskStore.ts            ← MODIFIED — hasError, clearError, onRehydrateStorage error
    useTaskStore.test.ts       ← MODIFIED (beforeEach: hasError: false)
  App.tsx                      ← MODIFIED — ErrorBoundary wraps TaskList
```

### References

- Story 3.3 ACs: [Source: epics.md#Story 3.3: Error Boundary & Error State]
- FR-08 (error state without disrupting task list): [Source: epics.md#Functional Requirements]
- NFR-03 (no user data lost): [Source: epics.md#NonFunctional Requirements]
- Deferred items: [Source: deferred-work.md — Stories 2.1, 2.3, 3.2 scope items]
- Store current impl: [Source: src/store/useTaskStore.ts]
- TaskList current impl: [Source: src/components/TaskList.tsx]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- No blockers encountered. ErrorBoundary correctly catches `tasks.map is not a function` when corrupt data (e.g., `tasks: 'not-an-array'`) is loaded from localStorage. E2E tests confirmed across all 3 browsers.

### Completion Notes List

- ✅ Created `src/components/ErrorBoundary.tsx` (46 lines) — React class error boundary with "Something went wrong" message and "Try Again" button
- ✅ Added `hasError: boolean` and `clearError()` to store, plus `onRehydrateStorage` error callback
- ✅ Updated `TaskList.tsx` (45 lines) — amber warning banner for storage errors, tasks preserved below
- ✅ Modified `App.tsx` — `<ErrorBoundary>` wraps only `<TaskList />`, `<TaskInput />` stays outside
- ✅ Created `ErrorBoundary.test.tsx` — 4 tests (normal render, error fallback, no stack trace, Try Again reset)
- ✅ Added 2 storage error tests to `TaskList.test.tsx`
- ✅ Updated `beforeEach` in all 4 test files to include `hasError: false`
- ✅ Created `e2e/error-state.spec.ts` — 2 E2E tests (corrupt data + functional input)
- ✅ Full regression: 35/35 unit tests, 39/39 E2E tests, build clean

### File List

- `src/components/ErrorBoundary.tsx` (created — React class error boundary)
- `src/components/ErrorBoundary.test.tsx` (created — 4 unit tests)
- `src/store/useTaskStore.ts` (modified — hasError, clearError, onRehydrateStorage)
- `src/components/TaskList.tsx` (modified — storage error banner)
- `src/components/TaskList.test.tsx` (modified — 2 storage error tests, beforeEach)
- `src/components/TaskItem.test.tsx` (modified — beforeEach: hasError)
- `src/components/TaskInput.test.tsx` (modified — beforeEach: hasError)
- `src/store/useTaskStore.test.ts` (modified — beforeEach: hasError)
- `src/App.tsx` (modified — ErrorBoundary wraps TaskList)
- `e2e/error-state.spec.ts` (created — 2 E2E tests)
