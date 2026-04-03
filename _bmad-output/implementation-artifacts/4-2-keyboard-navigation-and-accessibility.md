# Story 4.2: Keyboard Navigation & Accessibility

Status: done

## Story

As a user who navigates by keyboard or uses a screen reader,
I want every interaction to be fully operable without a mouse,
so that the app is usable regardless of how I interact with my computer.

## Acceptance Criteria

1. Tab moves focus logically through: task input → submit button → each task's toggle → each task's delete button
2. All focus states are clearly visible (not relying on browser default outline alone)
3. Enter on submit button with input text adds a task — identical to mouse click
4. Enter or Space on a task's completion toggle toggles the task
5. Enter or Space on a task's delete control deletes the task
6. All interactive elements use semantic HTML (`<button>`, `<input>`) — no `div` click handlers
7. All icon-only controls have appropriate `aria-label` attributes
8. Automated axe-core audit in `accessibility.spec.ts` returns zero WCAG 2.1 AA violations
9. Color contrast for all text meets 4.5:1 minimum ratio (NFR-06)

## Tasks / Subtasks

- [x] Task 1: Audit and fix focus visibility (AC: 2)
  - [x] Reviewed all interactive elements — all have `focus:ring-*` classes
  - [x] Checkbox: added `focus:ring-2 focus:ring-offset-1` for visible keyboard focus
  - [x] Input, Add button, Delete button, Dismiss button, Try Again button all have focus rings
  - [x] Focus ring contrast verified (blue/red rings on white backgrounds)

- [x] Task 2: Fix deferred accessibility issues from previous reviews
  - [x] Added `aria-hidden="true"` to desktop duplicate timestamp span in TaskItem.tsx
  - [x] Increased delete button `px-2` → `px-3` for wider touch target
  - [x] `autoFocus` kept — acceptable for single-purpose task input app
  - [x] Added `aria-live` feedback: empty submit shows `role="alert"` with "Please enter a task" (sr-only)
  - [x] Added `aria-invalid` and `aria-describedby` on input when error present

- [x] Task 3: Verify semantic HTML and aria-labels (AC: 6, 7)
  - [x] Confirmed: `<form>`, `<input>`, `<button type="submit">`, `<input type="checkbox">`, `<button>` — all semantic
  - [x] Confirmed: checkbox `aria-label` dynamically reflects "complete"/"incomplete" state
  - [x] Confirmed: delete button `aria-label` includes task text

- [x] Task 4: Write axe-core accessibility audit E2E test (AC: 8, 9)
  - [x] Created `e2e/accessibility.spec.ts`
  - [x] Test: empty state — zero WCAG 2.1 AA violations
  - [x] Test: with tasks — zero violations
  - [x] Test: with completed task — zero violations
  - [x] Color contrast fixes: `bg-blue-500` → `bg-blue-600`, `text-blue-500` → `text-blue-700`, `text-gray-400` → `text-gray-500`, `text-red-500` → `text-red-600`

- [x] Task 5: Write keyboard navigation E2E test (AC: 1, 3, 4, 5)
  - [x] Tab order test (chromium only — Firefox/WebKit Tab behavior is OS-dependent)
  - [x] Space toggles checkbox completion
  - [x] Tests pass on all browsers for axe-core, chromium-only for Tab order

- [x] Task 6: Full regression run
  - [x] Run `npm run test:run` — 35/35 unit/integration tests pass
  - [x] Run `npx playwright test` — 58 passed, 2 skipped (Tab order on Firefox/WebKit)
  - [x] Run `npm run build` — zero TypeScript errors

### Senior Developer Review (AI)

**Review Date:** 2026-04-03
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Approved with patches (5 patches, 0 deferred)

#### Review Findings

- [x] [Review][Patch] Added red border on input when error — sighted users now see visual feedback [src/components/TaskInput.tsx]
- [x] [Review][Patch] `<p id="input-error" role="alert">` always rendered, content toggles — reliable screen reader announcement [src/components/TaskInput.tsx:44]
- [x] [Review][Patch] Added `aria-label="New task"` on input [src/components/TaskInput.tsx:31]
- [x] [Review][Patch] Added `role="alert"` to storage error banner [src/components/TaskList.tsx:21]
- [x] [Review][Patch] Added `focus:ring-2 focus:ring-amber-500` to Dismiss button [src/components/TaskList.tsx:25]

## Dev Notes

### Current Accessibility State

**Already good:**
- `<form>`, `<input>`, `<button type="submit">` — semantic HTML for TaskInput
- `<input type="checkbox">` — native checkbox for toggle
- `<button>` — semantic for delete
- `<ul>` / `<li>` — semantic list structure
- `aria-label` on checkbox: `Mark "${task.text}" as complete/incomplete`
- `aria-label` on delete: `Delete "${task.text}"`
- `focus:ring-*` on most interactive elements

**Needs fixing:**
- Duplicate timestamp — screen readers announce twice (add `aria-hidden="true"` to desktop span)
- Delete button `px-2` may be too narrow for touch targets
- No `aria-live` feedback for empty submit rejection
- `autoFocus` — acceptable for this app but should be noted

### Duplicate Timestamp Fix

```tsx
// Mobile timestamp (visible to screen readers)
<span className="block text-xs text-gray-400 sm:hidden">{formattedDate}</span>
// Desktop timestamp (hidden from screen readers — duplicate)
<span aria-hidden="true" className="hidden shrink-0 text-xs text-gray-400 sm:inline">{formattedDate}</span>
```

### Empty Submit Feedback

Add an `aria-live` region to TaskInput that announces when submit is rejected:

```tsx
export function TaskInput() {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const addTask = useTaskStore((s) => s.addTask)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Please enter a task')
      return
    }
    setError('')
    addTask(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => { setText(e.target.value); setError('') }}
        placeholder="Add a task..."
        autoFocus
        aria-invalid={!!error}
        aria-describedby={error ? 'input-error' : undefined}
        className="..."
      />
      <button type="submit" className="...">Add</button>
      {error && (
        <p id="input-error" role="alert" className="sr-only">{error}</p>
      )}
    </form>
  )
}
```

The `sr-only` class makes it visually hidden but announced by screen readers. `role="alert"` with `aria-live="assertive"` announces immediately.

### axe-core Audit Pattern

```ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('empty state has zero WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('task list has zero WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
    await page.getByPlaceholder('Add a task...').fill('Test task')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Test task')).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})
```

### Keyboard Navigation Test Pattern

```ts
test('Tab order follows logical sequence', async ({ page }) => {
  await page.goto('/')
  // Add a task first
  await page.getByPlaceholder('Add a task...').fill('Test')
  await page.getByPlaceholder('Add a task...').press('Enter')

  // Start from beginning
  await page.keyboard.press('Tab') // → input
  await expect(page.getByPlaceholder('Add a task...')).toBeFocused()
  await page.keyboard.press('Tab') // → Add button
  await expect(page.getByRole('button', { name: /add/i })).toBeFocused()
  await page.keyboard.press('Tab') // → checkbox
  await expect(page.getByRole('checkbox')).toBeFocused()
  await page.keyboard.press('Tab') // → delete button
  await expect(page.getByRole('button', { name: /delete/i })).toBeFocused()
})
```

### Color Contrast Notes

Current Tailwind colors to verify against WCAG 4.5:1:
- `text-gray-900` on `bg-white` — very high contrast, passes
- `text-gray-500` on `bg-white` — ~5.7:1 ratio, passes
- `text-gray-400` on `bg-white` — ~3.9:1 ratio, **may fail** for normal text. Consider upgrading to `text-gray-500`
- `text-blue-500` on `bg-gray-50` — ~4.6:1 ratio, passes
- `text-red-500` on `bg-white` — ~4.6:1 ratio, borderline passes
- `text-amber-800` on `bg-amber-50` — ~7.3:1 ratio, passes

**Key concern:** `text-gray-400` is used for timestamps and "Add your first task above" — may need to be `text-gray-500` to meet 4.5:1.

### Architecture Constraints (MUST follow)

| Rule | Detail |
|---|---|
| Modified files | `src/components/TaskItem.tsx`, `src/components/TaskInput.tsx` |
| E2E created | `e2e/accessibility.spec.ts` |
| axe-core | Use `@axe-core/playwright` (already installed), `.withTags(['wcag2a', 'wcag2aa'])` |
| No new components | All fixes inline in existing components |
| Semantic HTML | Already in place — verify, don't change unnecessarily |
| Line limit | ≤ 150 lines per file |

### Anti-Patterns — Explicitly Forbidden

```tsx
// ❌ Never use div with onClick for interactive controls
<div onClick={handler} role="button">Click me</div>

// ❌ Never remove focus outlines without replacement
className="focus:outline-none"  // Without focus:ring-* is BAD

// ❌ Never use color alone to convey information
// Strikethrough + color change is OK (two signals)

// ❌ Never suppress axe-core violations — fix them
.disableRules(['color-contrast'])
```

### Deferred Items Addressed by This Story

From deferred-work.md:
- `autoFocus` may disrupt screen reader users (Story 2.2 review)
- No accessible feedback when empty submit rejected (Story 2.2 review)
- Aria-label doesn't verify state flip (Story 2.4 review)
- Duplicated timestamp announced twice (Story 4.1 review)
- Delete button touch target under 44px (Story 4.1 review)

### Previous Story Intelligence

- `TaskItem.tsx` (42 lines) — has aria-labels, semantic HTML, responsive layout from 4.1
- `TaskInput.tsx` (37 lines) — form with `<input>` + `<button type="submit">`, `autoFocus`
- `@axe-core/playwright` already installed, smoke test at `e2e/smoke.spec.ts` confirms it works
- Tailwind v4 — `sr-only` utility available for visually hidden text
- 35/35 unit tests, 45/45 E2E tests passing
- `npm run build` clean

### Project Structure After This Story

```
e2e/
  accessibility.spec.ts        ← NEW — axe-core audit + keyboard nav tests
  responsive.spec.ts           ← unchanged
  complete-task.spec.ts        ← unchanged
  delete-task.spec.ts          ← unchanged
  empty-state.spec.ts          ← unchanged
  error-state.spec.ts          ← unchanged
  smoke.spec.ts                ← unchanged
src/
  components/
    TaskItem.tsx               ← MODIFIED — aria-hidden on duplicate timestamp, wider delete button
    TaskInput.tsx              ← MODIFIED — aria-live feedback for empty submit
    TaskList.tsx               ← possibly MODIFIED (contrast fix on text-gray-400)
    ErrorBoundary.tsx          ← unchanged
  App.tsx                      ← unchanged
```

### References

- Story 4.2 ACs: [Source: epics.md#Story 4.2: Keyboard Navigation & Accessibility]
- NFR-06 (keyboard nav, 4.5:1 contrast): [Source: epics.md#NonFunctional Requirements]
- WCAG 2.1 AA: [Source: architecture.md]
- axe-core: [Source: e2e/smoke.spec.ts — confirms importable]
- Deferred items: [Source: deferred-work.md — Stories 2.2, 2.4, 4.1]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **axe-core contrast violation:** `bg-blue-500` (#2b7fff) with white text had 3.76:1 ratio — below 4.5:1 minimum. Fixed by upgrading to `bg-blue-600` (#2563eb). Also fixed heading `text-blue-500` → `text-blue-700`, timestamps `text-gray-400` → `text-gray-500`, delete `text-red-500` → `text-red-600`, ErrorBoundary `bg-red-500` → `bg-red-600`.
- **Tab order test:** Failed on Firefox and WebKit due to OS-level Tab focus preferences (macOS doesn't Tab to buttons by default in Safari/Firefox). Skipped on non-chromium browsers.

### Completion Notes List

- ✅ Updated `TaskItem.tsx` (42 lines) — `aria-hidden` on desktop timestamp, `px-3` delete button, `text-gray-500` contrast fix, `focus:ring-2` on checkbox
- ✅ Updated `TaskInput.tsx` (45 lines) — `aria-live` error feedback for empty submit, `aria-invalid`, `aria-describedby`, `bg-blue-600` contrast fix, `placeholder-gray-500`
- ✅ Updated `TaskList.tsx` — `text-gray-500` on "Add your first task above"
- ✅ Updated `App.tsx` — `text-blue-700` heading for contrast
- ✅ Updated `ErrorBoundary.tsx` — `bg-red-600` button for contrast
- ✅ Created `e2e/accessibility.spec.ts` — 3 axe-core WCAG 2.1 AA audits + 2 keyboard nav tests
- ✅ Zero axe-core violations across all states (empty, tasks, completed)
- ✅ Full regression: 35/35 unit, 58 passed + 2 skipped E2E, build clean

### File List

- `src/components/TaskItem.tsx` (modified — aria-hidden, contrast, touch target, focus ring)
- `src/components/TaskInput.tsx` (modified — aria-live error feedback, contrast fix)
- `src/components/TaskList.tsx` (modified — contrast fix)
- `src/components/ErrorBoundary.tsx` (modified — contrast fix)
- `src/App.tsx` (modified — heading contrast fix)
- `e2e/accessibility.spec.ts` (created — 5 tests: 3 axe-core audits + 2 keyboard nav)
