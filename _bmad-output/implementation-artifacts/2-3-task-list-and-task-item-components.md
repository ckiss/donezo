# Story 2.3: Task List & Task Item Components

Status: done

## Story

As a user,
I want to see all my tasks displayed in a list with their description, completion status, and creation time,
so that I have a clear view of everything I need to do.

## Acceptance Criteria

1. Given the store contains one or more tasks, when the app renders, each task displays its text description, a completion toggle control, a delete control, and its creation timestamp
2. The list renders on first paint without requiring any user action (FR-05)
3. `TaskList.tsx` reads tasks from the store via `useTaskStore((s) => s.tasks)` — no prop drilling
4. `TaskItem.tsx` receives a single `Task` prop from `TaskList` and calls store actions directly
5. Neither component exceeds 150 lines
6. Component tests cover: rendering with one task, rendering with multiple tasks, and correct display of all three data points (text, completion state, timestamp)

## Tasks / Subtasks

- [x] Task 1: Create `src/components/TaskItem.tsx` (AC: 1, 4, 5)
  - [x] Create `TaskItem.tsx` as a pure presentational + store-action component
  - [x] Accept single `Task` prop (id, text, completed, createdAt)
  - [x] Read `toggleTask` and `deleteTask` from store directly — no callbacks from parent
  - [x] Display task text with strikethrough/muted style when `completed: true`
  - [x] Display `createdAt` as a human-readable timestamp (e.g., `new Date(createdAt).toLocaleString()`)
  - [x] Render a checkbox or button for completion toggle (calls `toggleTask(task.id)`)
  - [x] Render a delete button (calls `deleteTask(task.id)`)
  - [x] Use semantic HTML: `<li>`, `<button>`, `<label>` with `<input type="checkbox">` or equivalent
  - [x] Apply Tailwind utility classes per architecture convention (layout → spacing → typography → colour → state)
  - [x] Confirm file does not exceed 150 lines (37 lines)

- [x] Task 2: Create `src/components/TaskList.tsx` (AC: 2, 3, 5)
  - [x] Create `TaskList.tsx` as a container component
  - [x] Read `tasks` from store via `useTaskStore((s) => s.tasks)` — no props
  - [x] Map `tasks` array to `<TaskItem>` components, keyed by `task.id`
  - [x] Render as a `<ul>` with each `<TaskItem>` as a child `<li>` wrapper (or TaskItem renders its own `<li>`)
  - [x] When `tasks` is empty, render nothing (Story 3.1 handles empty state UI)
  - [x] Apply Tailwind utility classes for list layout
  - [x] Confirm file does not exceed 150 lines (16 lines)

- [x] Task 3: Integrate into `App.tsx` (AC: 2)
  - [x] Import and render `<TaskList />` below `<TaskInput />` in `App.tsx`
  - [x] Build passes with zero TypeScript errors (`npm run build`)

- [x] Task 4: Write component tests (AC: 6)
  - [x] Create `src/components/TaskList.test.tsx` with RTL integration tests
  - [x] Test: one task — seed store with one task, render `<TaskList />`, verify text appears
  - [x] Test: multiple tasks — seed store with two tasks, verify both texts appear
  - [x] Test: completed state — seed store with a completed task, verify completion visual indicator
  - [x] Test: timestamp display — verify `createdAt` value is rendered as human-readable text
  - [x] Test: empty store — render `<TaskList />` with no tasks, verify no task elements rendered
  - [x] Tests co-located in `TaskList.test.tsx` (covers TaskItem rendering via integration)
  - [x] Run `npm run test:run` — 23/23 tests pass, no regressions

### Senior Developer Review (AI)

**Review Date:** 2026-04-03
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Approved with patches (5 patches, 3 deferred)

#### Review Findings

- [x] [Review][Patch] Completion state test should assert checkbox `checked` attribute, not just CSS class [src/components/TaskList.test.tsx:42-47]
- [x] [Review][Patch] No test asserts delete button is rendered per AC #1 [src/components/TaskList.test.tsx]
- [x] [Review][Patch] No test asserts checkbox toggle control is rendered per AC #1 [src/components/TaskList.test.tsx]
- [x] [Review][Patch] No test for `checked={false}` on incomplete task [src/components/TaskList.test.tsx]
- [x] [Review][Patch] Timestamp test relies on `toLocaleString()` matching — fragile across locales [src/components/TaskList.test.tsx:50-55]
- [x] [Review][Defer] `createdAt` could render "Invalid Date" from corrupted localStorage [src/components/TaskItem.tsx:13] — deferred, Story 3.3 scope (rehydration validation)
- [x] [Review][Defer] Extremely long task text causes layout overflow [src/components/TaskItem.tsx:20-23] — deferred, Story 3.3/4.1 scope (no input length limit)
- [x] [Review][Defer] Duplicate task IDs from corrupted localStorage cause React key collision [src/components/TaskList.tsx:12] — deferred, Story 3.3 scope (rehydration validation)
- [x] [Review][Defer] Delete button has no confirmation dialog [src/components/TaskItem.tsx:28] — deferred, Story 2.4 scope (delete interaction design)

## Dev Notes

### Component Pattern: TaskItem

`TaskItem` receives one `Task` and reaches into the store for its action functions.

```tsx
import type { Task } from '../types'
import { useTaskStore } from '../store/useTaskStore'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const toggleTask = useTaskStore((s) => s.toggleTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)

  const formattedDate = new Date(task.createdAt).toLocaleString()

  return (
    <li className="flex items-center gap-3 p-4 border-b border-gray-100">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleTask(task.id)}
        className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
        aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
        {task.text}
      </span>
      <span className="text-xs text-gray-400">{formattedDate}</span>
      <button
        onClick={() => deleteTask(task.id)}
        className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
        aria-label={`Delete "${task.text}"`}
      >
        Delete
      </button>
    </li>
  )
}
```

### Component Pattern: TaskList

`TaskList` is a thin container — reads tasks, maps to items. No logic beyond that.

```tsx
import { useTaskStore } from '../store/useTaskStore'
import { TaskItem } from './TaskItem'

export function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)

  if (tasks.length === 0) return null  // Story 3.1 adds empty state UI here

  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}
```

### App.tsx Integration

```tsx
import './App.css'
import { TaskInput } from './components/TaskInput'
import { TaskList } from './components/TaskList'

function App() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="text-blue-500 text-2xl font-bold mb-4">Donezo</h1>
        <TaskInput />
        <TaskList />
      </div>
    </main>
  )
}

export default App
```

### Testing Pattern (RTL + Zustand integration)

Test against the real store — do NOT mock `useTaskStore`. Seed the store directly in `beforeEach`/each test.

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskList } from './TaskList'
import { useTaskStore } from '../store/useTaskStore'

beforeEach(() => {
  useTaskStore.setState({ tasks: [] })
  localStorage.clear()
})

describe('TaskList', () => {
  it('renders a single task', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Buy milk', completed: false, createdAt: Date.now() }],
    })
    render(<TaskList />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('renders multiple tasks', () => {
    useTaskStore.setState({
      tasks: [
        { id: '1', text: 'Buy milk', completed: false, createdAt: Date.now() },
        { id: '2', text: 'Walk dog', completed: false, createdAt: Date.now() },
      ],
    })
    render(<TaskList />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
  })

  it('renders nothing when store is empty', () => {
    render(<TaskList />)
    expect(screen.queryByRole('listitem')).toBeNull()
  })

  it('shows completion visual indicator for completed task', () => {
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Done task', completed: true, createdAt: Date.now() }],
    })
    render(<TaskList />)
    const text = screen.getByText('Done task')
    expect(text.className).toContain('line-through')
  })

  it('displays createdAt as human-readable timestamp', () => {
    const ts = new Date('2026-04-02T10:00:00').getTime()
    useTaskStore.setState({
      tasks: [{ id: '1', text: 'Timed task', completed: false, createdAt: ts }],
    })
    render(<TaskList />)
    // toLocaleString output is environment-specific — just assert something timestamp-like is rendered
    expect(screen.getByText('Timed task')).toBeInTheDocument()
    // Assert the formatted date element exists (text varies by locale)
    const formatted = new Date(ts).toLocaleString()
    expect(screen.getByText(formatted)).toBeInTheDocument()
  })
})
```

**Key testing notes:**
- This story tests RENDERING only — toggle/delete interactions are Story 2.4 scope (E2E)
- Seed via `useTaskStore.setState({ tasks: [...] })` — same pattern as Stories 2.1 and 2.2
- Query by text, role, or accessible label — not by CSS class
- `line-through` class check is intentional for completion state — tied directly to Tailwind class in the component

### Architecture Constraints (MUST follow)

| Rule | Detail |
|---|---|
| File locations | `src/components/TaskList.tsx`, `src/components/TaskItem.tsx` |
| Test locations | `src/components/TaskList.test.tsx`, `src/components/TaskItem.test.tsx` (or merged) |
| Store access in TaskList | `useTaskStore((s) => s.tasks)` — select only tasks |
| Store access in TaskItem | `useTaskStore((s) => s.toggleTask)` and `useTaskStore((s) => s.deleteTask)` — separate selectors |
| Props | TaskItem receives `task: Task` only — no action callbacks from parent |
| HTML semantics | `<ul>` + `<li>`, `<input type="checkbox">`, `<button>` — no div click handlers |
| Empty state | `TaskList` returns `null` when `tasks.length === 0` — Story 3.1 owns empty state UI |
| Line limit | ≤ 150 lines per file |
| No barrel files | Import directly from component path |
| Key prop | Always `task.id` — never array index |

### Anti-Patterns — Explicitly Forbidden

```tsx
// ❌ Never prop-drill store actions through TaskList to TaskItem
<TaskItem task={task} onToggle={toggleTask} onDelete={deleteTask} />

// ❌ Never hold tasks in TaskList local state
const [tasks, setTasks] = useState([])

// ❌ Never use array index as key
tasks.map((task, i) => <TaskItem key={i} task={task} />)

// ❌ Never use div with onClick instead of button
<div onClick={() => deleteTask(task.id)}>Delete</div>

// ❌ Never render the empty state here
if (tasks.length === 0) return <p>No tasks yet!</p>  // Story 3.1's job

// ❌ Never mock the store in tests
vi.mock('../store/useTaskStore')
```

### Previous Story Intelligence

- Store is at `src/store/useTaskStore.ts` — exports `useTaskStore` with `tasks`, `toggleTask`, `deleteTask`
- `Task` interface: `{ id: string, text: string, completed: boolean, createdAt: number }` — import from `../types`
- Node.js v25 localStorage mock is in `test-setup.ts` — no additional test infra needed
- Tests use `useTaskStore.setState({ tasks: [] })` + `localStorage.clear()` in `beforeEach`
- Story 2.4 covers toggle/delete interactions E2E — this story tests rendering only
- `App.tsx` currently has `TaskInput` rendered in `<div className="mx-auto max-w-2xl">` with padding on the h1 — adjust container as needed when adding `TaskList`
- 18/18 tests passing at start of this story — must not regress

### Project Structure After This Story

```
src/
  components/
    TaskInput.tsx            ← unchanged
    TaskInput.test.tsx       ← unchanged
    TaskItem.tsx             ← NEW — single task display + store actions
    TaskItem.test.tsx        ← NEW — rendering tests (or merged into TaskList.test.tsx)
    TaskList.tsx             ← NEW — reads tasks from store, maps to TaskItem
    TaskList.test.tsx        ← NEW — RTL integration tests
  store/
    useTaskStore.ts          ← unchanged
    useTaskStore.test.ts     ← unchanged
  App.tsx                    ← MODIFIED — imports and renders TaskList
  types.ts                   ← unchanged
  constants.ts               ← unchanged
```

### References

- TaskList/TaskItem component spec: [Source: architecture.md#Component Architecture]
- Store shape and actions: [Source: 2-1-zustand-store-and-persistence.md]
- Task interface: [Source: src/types.ts]
- Story 2.3 ACs: [Source: epics.md#Story 2.3: Task List & Task Item Components]
- Story 2.4 scope (interactions): [Source: epics.md#Story 2.4: Complete & Delete Task Interactions]
- FR-05 (display tasks on first paint): [Source: epics.md#Functional Requirements]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- No blockers encountered. Build clean on first attempt, all 23 tests passed.

### Completion Notes List

- ✅ Created `src/components/TaskItem.tsx` (37 lines) — `<li>` with checkbox toggle, text with strikethrough when completed, formatted timestamp, delete button; reads `toggleTask`/`deleteTask` from store directly
- ✅ Created `src/components/TaskList.tsx` (16 lines) — reads `tasks` from store, maps to `<TaskItem key={task.id}>`, returns `null` when empty
- ✅ Modified `App.tsx` — added `<TaskList />` below `<TaskInput />`, adjusted container to `p-4` + `mb-4` on heading
- ✅ Created `src/components/TaskList.test.tsx` — 5 RTL integration tests covering single task, multiple tasks, empty state, completion indicator, timestamp display
- ✅ Build clean: `npm run build` passes with zero TypeScript errors
- ✅ Full regression: 23/23 tests pass (18 prior + 5 new)

### File List

- `src/components/TaskItem.tsx` (created — single task display with checkbox, timestamp, delete button)
- `src/components/TaskList.tsx` (created — store-connected container, maps tasks to TaskItem)
- `src/components/TaskList.test.tsx` (created — 5 RTL integration tests)
- `src/App.tsx` (modified — renders TaskList below TaskInput)
