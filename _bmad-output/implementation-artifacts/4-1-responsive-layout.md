# Story 4.1: Responsive Layout

Status: done

## Story

As a user on any device,
I want the app to be fully usable on both mobile and desktop screens,
so that I can manage my tasks whether I'm at my desk or on my phone.

## Acceptance Criteria

1. Given the app is open on a mobile viewport (375px wide), all controls are visible, tappable, and not clipped or overflowing
2. Text is readable without horizontal scrolling on mobile
3. Given the app is open on a desktop viewport (1440px wide), the layout is appropriately constrained and not stretched uncomfortably wide
4. All Tailwind responsive utilities are used — no hardcoded pixel values in component styles
5. Playwright viewport tests confirm correct rendering at 375px and 1440px

## Tasks / Subtasks

- [x] Task 1: Audit and fix responsive layout issues (AC: 1, 2, 3, 4)
  - [x] Reviewed `App.tsx`: `max-w-2xl` + `mx-auto` + `p-4` — already responsive, no changes needed
  - [x] Reviewed `TaskInput.tsx`: `flex gap-2 p-4` with `flex-1` input — works at 375px, no changes needed
  - [x] Fixed `TaskItem.tsx`: main responsive changes applied
  - [x] Added `truncate` on task text to prevent overflow with ellipsis
  - [x] Added `min-w-0` on flex text container to allow truncation
  - [x] Timestamp responsive: `hidden sm:inline` for desktop, `sm:hidden` below text for mobile
  - [x] Checkbox: `h-5 w-5` (20px) larger touch target, `shrink-0` prevents collapse
  - [x] Delete button: `py-2` larger touch target, `shrink-0`
  - [x] No hardcoded pixel values — all Tailwind utilities
  - [x] All files under 150 lines (TaskItem: 40 lines)

- [x] Task 2: Add responsive padding/spacing refinements (AC: 1, 3)
  - [x] `App.tsx`: `p-4` already provides adequate mobile padding — no changes needed
  - [x] `TaskInput.tsx`: `p-4` already adequate — no changes needed
  - [x] `TaskItem.tsx`: `gap-3 p-4` works on both breakpoints

- [x] Task 3: Write Playwright viewport tests (AC: 5)
  - [x] Created `e2e/responsive.spec.ts`
  - [x] Test at 375px: app loads, input visible, add task works, no horizontal scrollbar
  - [x] Test at 1440px: content constrained ≤672px
  - [x] Run `npx playwright test` — 45/45 E2E tests pass across 3 browsers

- [x] Task 4: Full regression run
  - [x] Run `npm run test:run` — 35/35 unit/integration tests pass
  - [x] Run `npx playwright test` — 45/45 E2E tests pass
  - [x] Run `npm run build` — zero TypeScript errors

### Senior Developer Review (AI)

**Review Date:** 2026-04-03
**Reviewers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor (claude-opus-4-6, parallel)
**Outcome:** Approved with patches (3 patches, 2 deferred)

#### Review Findings

- [x] [Review][Patch] Added `title={task.text}` on truncated span for hover tooltip disclosure [src/components/TaskItem.tsx:24]
- [x] [Review][Patch] Timestamp test asserts `toHaveLength(2)` for precision [src/components/TaskList.test.tsx:94]
- [x] [Review][Patch] Changed to `items-start sm:items-center` for proper mobile two-line alignment [src/components/TaskItem.tsx:15]
- [x] [Review][Defer] Duplicated timestamp — screen readers announce date twice, needs `aria-hidden` on one — deferred, Story 4.2 (Accessibility) scope
- [x] [Review][Defer] Delete button touch target may be under 44px horizontally — deferred, Story 4.2 (WCAG 2.5.8) scope

## Dev Notes

### Current Responsive State Analysis

**App.tsx** — `max-w-2xl` (672px) + `mx-auto` + `p-4`. Already responsive-safe: content won't stretch past 672px on desktop, and `p-4` (16px) gives breathing room on mobile. No changes likely needed here.

**TaskInput.tsx** — `flex gap-2 p-4` with `flex-1` on input. The input shrinks naturally on mobile. The "Add" button is small. This should work at 375px. Verify with test.

**TaskItem.tsx** — The most fragile layout. Current: `flex items-center gap-3 p-4` containing:
- Checkbox (fixed size `h-4 w-4`)
- Task text (`flex-1 text-sm`) — no overflow control
- Timestamp (`text-xs`) — always visible, takes space
- Delete button (`px-2 py-1 text-xs`) — tappable but small

**Issues at 375px:**
1. Long task text + timestamp + delete button = horizontal overflow
2. No `min-w-0` on the flex child, so `flex-1` won't shrink below content width
3. Timestamp takes ~100px on mobile — consider hiding on small screens
4. Touch targets may be too small for checkbox and delete button

### Recommended TaskItem Changes

```tsx
<li className="flex items-center gap-3 p-4 border-b border-gray-100">
  <input
    type="checkbox"
    checked={task.completed}
    onChange={() => toggleTask(task.id)}
    className="h-5 w-5 shrink-0 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
    aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
  />
  <div className="min-w-0 flex-1">
    <span className={`block truncate text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
      {task.text}
    </span>
    <span className="block text-xs text-gray-400 sm:hidden">{formattedDate}</span>
  </div>
  <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">{formattedDate}</span>
  <button
    onClick={() => deleteTask(task.id)}
    className="shrink-0 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
    aria-label={`Delete "${task.text}"`}
  >
    Delete
  </button>
</li>
```

Key changes:
- **`min-w-0`** on text container — allows flex child to shrink below content width
- **`truncate`** on task text — prevents overflow with ellipsis
- **`shrink-0`** on checkbox, timestamp, delete — prevents them from collapsing
- **`h-5 w-5`** on checkbox — larger touch target (20px vs 16px)
- **Timestamp hidden on mobile** — `hidden sm:inline` for desktop, `sm:hidden` for mobile (below timestamp)
- Mobile timestamp shown below task text in a stacked layout

### Playwright Viewport Test Pattern

```ts
import { test, expect } from '@playwright/test'

test.describe('Responsive layout', () => {
  test('mobile viewport (375px) — controls visible and usable', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    // Input and button visible
    await expect(page.getByPlaceholder('Add a task...')).toBeVisible()
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible()

    // Add a task and verify no overflow
    await page.getByPlaceholder('Add a task...').fill('A task with some text')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('A task with some text')).toBeVisible()

    // No horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(hasHorizontalScroll).toBe(false)

    await context.close()
  })

  test('desktop viewport (1440px) — content constrained', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    await expect(page.getByPlaceholder('Add a task...')).toBeVisible()

    // Content should be centered and constrained (max-w-2xl = 672px)
    const containerWidth = await page.locator('main > div').evaluate((el) => el.getBoundingClientRect().width)
    expect(containerWidth).toBeLessThanOrEqual(672)

    await context.close()
  })
})
```

### Architecture Constraints (MUST follow)

| Rule | Detail |
|---|---|
| Modified files | `src/components/TaskItem.tsx` (responsive layout) |
| Possibly modified | `src/App.tsx`, `src/components/TaskInput.tsx` (minor responsive tweaks) |
| E2E created | `e2e/responsive.spec.ts` |
| No hardcoded pixels | Only Tailwind utilities |
| No new components | Layout changes are inline in existing components |
| Line limit | ≤ 150 lines per file |
| Tailwind v4 | `@tailwindcss/vite` plugin, `@import "tailwindcss"` in App.css |

### Anti-Patterns — Explicitly Forbidden

```tsx
// ❌ Never use hardcoded pixel values
style={{ width: '375px' }}

// ❌ Never use media queries in CSS files — use Tailwind responsive prefixes
@media (max-width: 640px) { ... }

// ❌ Never hide critical controls on mobile
<button className="hidden sm:block">Delete</button>  // Delete must always be visible

// ❌ Never remove the timestamp entirely — move it, don't delete it
```

### Previous Story Intelligence

- `TaskItem.tsx` (36 lines) — flex row layout, no overflow control, `h-4 w-4` checkbox
- `TaskInput.tsx` (37 lines) — flex layout with `flex-1` input, already responsive
- `App.tsx` (20 lines) — `max-w-2xl mx-auto p-4`, already constrains desktop
- `TaskList.tsx` (45 lines) — container with border, no responsive issues expected
- Tailwind v4 via `@tailwindcss/vite` plugin — no tailwind.config.ts file, responsive prefixes (`sm:`, `md:`, `lg:`) work out of the box
- 35/35 unit tests, 39/39 E2E tests passing
- Deferred from Story 2.3 review: "Extremely long task text causes layout overflow" — this story addresses it

### Project Structure After This Story

```
e2e/
  responsive.spec.ts           ← NEW — viewport tests at 375px and 1440px
  complete-task.spec.ts        ← unchanged
  delete-task.spec.ts          ← unchanged
  empty-state.spec.ts          ← unchanged
  error-state.spec.ts          ← unchanged
  smoke.spec.ts                ← unchanged
src/
  components/
    TaskItem.tsx               ← MODIFIED — responsive layout, truncation, stacked timestamp
    TaskInput.tsx              ← possibly MODIFIED (minor responsive tweaks)
    TaskList.tsx               ← unchanged
    ErrorBoundary.tsx          ← unchanged
  App.tsx                      ← possibly MODIFIED (minor responsive tweaks)
```

### References

- Story 4.1 ACs: [Source: epics.md#Story 4.1: Responsive Layout]
- NFR-02 (375px to 1440px): [Source: epics.md#NonFunctional Requirements]
- Deferred overflow issue: [Source: deferred-work.md — Story 2.3 review]
- TaskItem current impl: [Source: src/components/TaskItem.tsx]
- Playwright config: [Source: e2e/playwright.config.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Unit test regression: `getByText(formatted)` found 2 elements after adding mobile+desktop timestamp spans. Fixed by switching to `getAllByText(formatted).length > 0`.

### Completion Notes List

- ✅ Updated `TaskItem.tsx` (40 lines) — `min-w-0`, `truncate`, `shrink-0`, `h-5 w-5` checkbox, responsive timestamp (`hidden sm:inline` / `sm:hidden`)
- ✅ Updated `TaskList.test.tsx` — fixed timestamp test to use `getAllByText` (2 timestamp elements: mobile + desktop)
- ✅ Created `e2e/responsive.spec.ts` — 2 viewport tests (375px mobile, 1440px desktop)
- ✅ `App.tsx` and `TaskInput.tsx` unchanged — already responsive
- ✅ Full regression: 35/35 unit tests, 45/45 E2E tests, build clean

### File List

- `src/components/TaskItem.tsx` (modified — responsive layout, truncation, stacked mobile timestamp)
- `src/components/TaskList.test.tsx` (modified — timestamp test uses getAllByText)
- `e2e/responsive.spec.ts` (created — 2 viewport tests at 375px and 1440px)
