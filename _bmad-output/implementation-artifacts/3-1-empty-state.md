# Story 3.1: Empty State

Status: done

## Story

As a user,
I want to see a clear, friendly message when I have no tasks,
so that the app feels intentional and complete rather than broken when the list is empty.

## Acceptance Criteria

1. Given no tasks exist in the store, when the app renders or the last task is deleted, `TaskList` renders an empty state UI (not a blank screen)
2. The empty state includes a message indicating there are no tasks and prompts the user to add one
3. The empty state is rendered inline within `TaskList.tsx` — no separate component required
4. The `TaskInput` remains visible and functional while the empty state is shown
5. Component tests in `TaskList.test.tsx` cover the empty state render
6. An E2E test in `empty-state.spec.ts` covers: load app with no tasks → empty state shown; add a task → list shown; delete last task → empty state shown again

## Tasks / Subtasks

- [x] Task 1: Update `TaskList.tsx` to render empty state (AC: 1, 2, 3)
  - [x] Replace `return null` when `tasks.length === 0` with empty state JSX
  - [x] Include a message "No tasks yet" and prompt "Add your first task above"
  - [x] Use semantic HTML: `<div>` with `<p>` elements
  - [x] Apply Tailwind utility classes: centered text, muted color, appropriate spacing
  - [x] Ensure `TaskList` still renders the `<ul>` list when tasks exist (no regression)
  - [x] Confirm file does not exceed 150 lines (22 lines)

- [x] Task 2: Update unit tests in `TaskList.test.tsx` (AC: 5)
  - [x] Modified "renders nothing when store is empty" → "renders empty state when store has no tasks"
  - [x] Verify empty state text content ("No tasks yet", "Add your first task above")
  - [x] Verify no `<ul>` (role="list") rendered in empty state
  - [x] Run `npm run test:run` — 27/27 tests pass, no regressions

- [x] Task 3: Write E2E test `e2e/empty-state.spec.ts` (AC: 6)
  - [x] Test: load app with no tasks → empty state message is visible
  - [x] Test: add a task → empty state disappears, task list appears
  - [x] Test: delete last task → empty state reappears
  - [x] Run `npx playwright test` — 33/33 E2E tests pass across 3 browsers

- [x] Task 4: Full regression run
  - [x] Run `npm run test:run` — 27/27 unit/integration tests pass
  - [x] Run `npx playwright test` — 33/33 E2E tests pass
  - [x] Run `npm run build` — zero TypeScript errors

### Senior Developer Review (AI)

**Review Date:** 2026-04-03
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Approved (1 patch, 0 deferred new)

#### Review Findings

- [x] [Review][Patch] E2E delete test should wait for task to be visible before clicking delete [e2e/empty-state.spec.ts:25-30]

## Dev Notes

### Current TaskList.tsx (Line 7 is the change point)

```tsx
export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)

  if (tasks.length === 0) return null // ← REPLACE THIS LINE

  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}
```

### Implementation Pattern

Replace the `return null` with an empty state message. Keep it inline — no separate component.

```tsx
import { useTaskStore } from '../store/useTaskStore'
import { TaskItem } from './TaskItem'

export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)

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

### Test Updates

The existing test "renders nothing when store is empty" must be changed to assert the empty state message instead of `queryByRole('listitem')` being null.

```tsx
it('renders empty state when store has no tasks', () => {
  render(<TaskList />)
  expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  expect(screen.queryByRole('list')).toBeNull()
})
```

### E2E Test Pattern

```ts
import { test, expect } from '@playwright/test'

test.describe('Empty state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('shows empty state when no tasks exist', async ({ page }) => {
    await expect(page.getByText('No tasks yet')).toBeVisible()
  })

  test('hides empty state when a task is added', async ({ page }) => {
    await expect(page.getByText('No tasks yet')).toBeVisible()
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('No tasks yet')).not.toBeVisible()
    await expect(page.getByText('Buy milk')).toBeVisible()
  })

  test('shows empty state again when last task is deleted', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('No tasks yet')).not.toBeVisible()
    await page.getByRole('button', { name: /delete "Buy milk"/i }).click()
    await expect(page.getByText('No tasks yet')).toBeVisible()
  })
})
```

### Architecture Constraints (MUST follow)

| Rule | Detail |
|---|---|
| File modified | `src/components/TaskList.tsx` — add empty state inline |
| Test modified | `src/components/TaskList.test.tsx` — update empty state test |
| E2E created | `e2e/empty-state.spec.ts` |
| No new components | Empty state is inline in TaskList, NOT a separate component |
| TaskInput stays visible | `App.tsx` renders `<TaskInput />` independently — no changes needed |
| Line limit | ≤ 150 lines per file |
| Styling | Tailwind utility classes, muted text colors, centered |

### Anti-Patterns — Explicitly Forbidden

```tsx
// ❌ Never create a separate EmptyState component for this
import { EmptyState } from './EmptyState'

// ❌ Never hide TaskInput when empty
if (tasks.length === 0) return <EmptyState /> // missing TaskInput

// ❌ Never use conditional rendering in App.tsx for this
{tasks.length === 0 ? <EmptyState /> : <TaskList />}

// ❌ Never use an image or complex illustration — keep it text-only for now
<img src="empty.svg" />
```

### Previous Story Intelligence

- `TaskList.tsx` (16 lines) — currently returns `null` at line 7 when tasks empty
- `TaskList.test.tsx` (73 lines) — has "renders nothing when store is empty" test at line 34 that must be updated
- `App.tsx` renders `<TaskInput />` then `<TaskList />` independently — TaskInput remains visible regardless
- All E2E tests use `beforeEach` with `page.evaluate(() => localStorage.clear())` + `page.goto('/')` pattern
- 27/27 unit tests, 24/24 E2E tests passing at start of this story
- `npm run build` clean

### Project Structure After This Story

```
e2e/
  empty-state.spec.ts          ← NEW — E2E empty state journey
  complete-task.spec.ts        ← unchanged
  delete-task.spec.ts          ← unchanged
  smoke.spec.ts                ← unchanged
  playwright.config.ts         ← unchanged
src/
  components/
    TaskInput.tsx              ← unchanged
    TaskInput.test.tsx         ← unchanged
    TaskItem.tsx               ← unchanged
    TaskItem.test.tsx          ← unchanged
    TaskList.tsx               ← MODIFIED — empty state replaces return null
    TaskList.test.tsx          ← MODIFIED — updated empty state test
  store/
    useTaskStore.ts            ← unchanged
    useTaskStore.test.ts       ← unchanged
  App.tsx                      ← unchanged
```

### References

- Story 3.1 ACs: [Source: epics.md#Story 3.1: Empty State]
- FR-06 (empty state UI): [Source: epics.md#Functional Requirements]
- FR-05 (renders on first paint): [Source: epics.md#Functional Requirements]
- TaskList current impl: [Source: src/components/TaskList.tsx]
- TaskList tests: [Source: src/components/TaskList.test.tsx]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- No blockers encountered. All tests passed on first run.

### Completion Notes List

- ✅ Updated `src/components/TaskList.tsx` (22 lines) — replaced `return null` with empty state `<div>` containing "No tasks yet" + "Add your first task above"
- ✅ Updated `src/components/TaskList.test.tsx` — changed empty state test to assert message text and no list element
- ✅ Created `e2e/empty-state.spec.ts` — 3 E2E tests covering empty→list→empty lifecycle
- ✅ Full regression: 27/27 unit tests, 33/33 E2E tests (3 browsers), build clean

### File List

- `src/components/TaskList.tsx` (modified — empty state replaces return null)
- `src/components/TaskList.test.tsx` (modified — updated empty state test)
- `e2e/empty-state.spec.ts` (created — 3 E2E empty state journey tests)
