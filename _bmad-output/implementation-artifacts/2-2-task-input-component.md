# Story 2.2: Task Input Component

Status: done

## Story

As a user,
I want an input field and submit button to add new tasks,
so that I can capture things I need to do without any friction.

## Acceptance Criteria

1. Given the app is open, when I type a task description and press Enter or click the submit button, the task appears in the list within 300ms
2. The input field clears and returns focus after successful submit, ready for the next entry
3. When I attempt to submit an empty or whitespace-only input, nothing is added to the list and the input remains focused
4. `TaskInput.tsx` does not exceed 150 lines
5. The input is keyboard accessible (focusable, submittable via Enter)
6. Component tests in `TaskInput.test.tsx` cover valid submit, empty submit, and input-clear behaviour

## Tasks / Subtasks

- [x] Task 1: Create `src/components/TaskInput.tsx` (AC: 1, 2, 3, 4, 5)
  - [x] Create `src/components/` directory
  - [x] Create `TaskInput.tsx` as a controlled form with `<input>` + `<button type="submit">`
  - [x] Use local `useState` for input value — NOT for task state (task state is in the store only)
  - [x] Wire `onSubmit` handler: call `addTask(text)`, clear input, refocus input
  - [x] Guard empty/whitespace submit at the component level (don't call `addTask` with empty text — better UX, avoids unnecessary store call)
  - [x] Use `useRef` for input ref to manage focus after submit
  - [x] Ensure `<form>` wraps input+button so Enter triggers submit natively
  - [x] Confirm file does not exceed 150 lines (37 lines)

- [x] Task 2: Integrate `TaskInput` into `App.tsx` (AC: 1)
  - [x] Import and render `<TaskInput />` inside `<App />`
  - [x] Build passes with zero TypeScript errors

- [x] Task 3: Write component tests in `src/components/TaskInput.test.tsx` (AC: 6)
  - [x] Test: valid text submit — type text, submit form, verify store has the task AND input is cleared
  - [x] Test: empty submit — submit with empty input, verify store is empty and input stays focused
  - [x] Test: whitespace-only submit — submit with spaces, verify store is empty
  - [x] Test: input clears and refocuses after valid submit
  - [x] Test: Enter key triggers submit (form submit, not custom keydown handler)
  - [x] Run `npm run test:run` — 18/18 tests pass, no regressions

### Senior Developer Review (AI)

**Review Date:** 2026-04-02
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Approved (0 patches, 2 deferred)

#### Review Findings

- [x] [Review][Defer] `autoFocus` may disrupt screen reader users on mount/remount [src/components/TaskInput.tsx:26] — deferred, Story 4.2 (Accessibility) scope
- [x] [Review][Defer] No accessible feedback (aria-live/aria-invalid) when empty submit is silently rejected [src/components/TaskInput.tsx:12] — deferred, Story 4.2 (Accessibility) scope

## Dev Notes

### Component Pattern

`TaskInput` is a self-contained form. It calls `addTask` from the store directly — no props, no callbacks from parent.

```tsx
import { useState, useRef, type FormEvent } from 'react'
import { useTaskStore } from '../store/useTaskStore'

export function TaskInput() {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addTask = useTaskStore((s) => s.addTask)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return  // guard at component level for UX
    addTask(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a task..."
        autoFocus
      />
      <button type="submit">Add</button>
    </form>
  )
}
```

**Key decisions in this pattern:**
- `<form onSubmit>` gives us Enter-to-submit for free — no custom `onKeyDown` handler needed
- `e.preventDefault()` prevents page reload on form submit
- Component trims text before calling store (double-guard with store's own trim — belt and suspenders)
- `autoFocus` puts cursor in input on first render
- `inputRef.current?.focus()` returns focus after submit

### Styling (Tailwind)

Apply Tailwind utility classes per architecture convention (layout → spacing → typography → colour → state):

```tsx
<form onSubmit={handleSubmit} className="flex gap-2 p-4">
  <input
    ref={inputRef}
    type="text"
    value={text}
    onChange={(e) => setText(e.target.value)}
    placeholder="Add a task..."
    autoFocus
    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
  />
  <button
    type="submit"
    className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    Add
  </button>
</form>
```

UI design is not spec'd — use reasonable defaults. Story 4.1 (Responsive Layout) and 4.2 (Accessibility) will refine.

### Testing Pattern (RTL + Zustand integration)

Test against the real store — do NOT mock `useTaskStore`. This is an integration test that verifies the component correctly interacts with the store.

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskInput } from './TaskInput'
import { useTaskStore } from '../store/useTaskStore'

beforeEach(() => {
  useTaskStore.setState({ tasks: [] })
  localStorage.clear()
})

describe('TaskInput', () => {
  it('adds a task on valid submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    const input = screen.getByPlaceholderText('Add a task...')
    await user.type(input, 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0].text).toBe('Buy milk')
  })

  it('clears input after valid submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    const input = screen.getByPlaceholderText('Add a task...')
    await user.type(input, 'Buy milk')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(input).toHaveValue('')
  })

  it('does not add task on empty submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('does not add task on whitespace-only submit', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.type(screen.getByPlaceholderText('Add a task...'), '   ')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(useTaskStore.getState().tasks).toHaveLength(0)
  })

  it('submits on Enter key', async () => {
    const user = userEvent.setup()
    render(<TaskInput />)
    await user.type(screen.getByPlaceholderText('Add a task...'), 'Walk dog{Enter}')
    expect(useTaskStore.getState().tasks[0].text).toBe('Walk dog')
  })
})
```

**Key testing notes:**
- Use `userEvent.setup()` (not `fireEvent`) — more realistic user interaction simulation
- `{Enter}` in `user.type()` triggers form submit natively — tests the real browser behavior
- Query by accessible role/placeholder — not by CSS class or test-id
- Check store state directly via `useTaskStore.getState()` — verifies the full integration
- `beforeEach` resets store and localStorage (same pattern as Story 2.1 tests)

### Architecture Constraints (MUST follow)

| Rule | Detail |
|---|---|
| File location | `src/components/TaskInput.tsx` |
| Test location | `src/components/TaskInput.test.tsx` (co-located) |
| Store access | `useTaskStore((s) => s.addTask)` — select only what's needed |
| Local state | `useState` for input text only — no task state in component |
| HTML semantics | `<form>`, `<input>`, `<button type="submit">` — no `div` click handlers |
| Line limit | ≤ 150 lines |
| No barrel files | Import directly: `import { TaskInput } from './components/TaskInput'` |

### Anti-Patterns — Explicitly Forbidden

```tsx
// ❌ Never hold tasks in local state
const [tasks, setTasks] = useState([])

// ❌ Never use div with onClick for submit
<div onClick={handleSubmit}>Submit</div>

// ❌ Never use custom onKeyDown for Enter — use <form onSubmit>
input.onKeyDown = (e) => { if (e.key === 'Enter') ... }

// ❌ Never pass addTask as a prop from parent
<TaskInput onAdd={addTask} />

// ❌ Never import Task type in TaskInput — it doesn't need it
import type { Task } from '../types'
```

### Previous Story Intelligence (Story 2.1)

- Store is at `src/store/useTaskStore.ts` — exports `useTaskStore` with `addTask`
- `addTask(text)` trims and guards empty/whitespace internally — component guard is a UX optimization, not a correctness requirement
- Node.js v25 localStorage mock is in `test-setup.ts` — no additional test infra needed
- Tests use `useTaskStore.setState({ tasks: [] })` + `localStorage.clear()` in `beforeEach`
- Store tests passed 12/12, build clean

### Project Structure After This Story

```
src/
  components/                ← NEW directory
    TaskInput.tsx            ← NEW — controlled form + submit
    TaskInput.test.tsx       ← NEW — RTL integration tests
  store/
    useTaskStore.ts          ← unchanged (from Story 2.1)
    useTaskStore.test.ts     ← unchanged
  App.tsx                    ← MODIFIED — imports and renders TaskInput
  types.ts                   ← unchanged
  constants.ts               ← unchanged
```

### References

- TaskInput component spec: [Source: architecture.md#Component Architecture → TaskInput]
- Component boundaries: [Source: architecture.md#Architectural Boundaries]
- Communication pattern: [Source: architecture.md#Communication Patterns → Component → Store]
- Naming rules: [Source: architecture.md#Naming Patterns]
- Tailwind class order: [Source: architecture.md#Tailwind Class Organisation]
- Anti-patterns: [Source: architecture.md#Enforcement Guidelines]
- Story 2.2 ACs: [Source: epics.md#Story 2.2: Task Input Component]
- FR-01 (create task): [Source: epics.md#Functional Requirements]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- No blockers encountered. All tests passed on first run after implementation.

### Completion Notes List

- ✅ Created `src/components/TaskInput.tsx` (37 lines) — controlled form with `<form onSubmit>`, `useState`, `useRef` for focus
- ✅ Semantic HTML: `<form>`, `<input>`, `<button type="submit">` — Enter key submits natively
- ✅ Component guards empty/whitespace submit at component level before calling store
- ✅ Tailwind styling applied (layout → spacing → typography → colour → state)
- ✅ Integrated into `App.tsx` with max-w-2xl container
- ✅ 5/5 component tests pass (valid submit, empty submit, whitespace submit, input clear+refocus, Enter key)
- ✅ Full regression: 18/18 tests pass, `npm run build` clean

### File List

- `src/components/TaskInput.tsx` (created — controlled form component)
- `src/components/TaskInput.test.tsx` (created — 5 RTL integration tests)
- `src/App.tsx` (modified — imports and renders TaskInput)
