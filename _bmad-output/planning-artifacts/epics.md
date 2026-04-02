---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-04-02'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd-donezo.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

# Donezo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Donezo, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-01: Users can create a todo item by entering a text description and submitting; the item appears in the list immediately upon submission (within 300ms); input field clears after submit.

FR-02: Each todo item displays its text description, completion status, and creation timestamp.

FR-03: Users can mark a todo item as complete or incomplete; visual state updates immediately and persists on page refresh.

FR-04: Users can delete a todo item; item is removed from the list immediately and not restored on refresh.

FR-05: The todo list renders on application load without requiring user action or onboarding; displays existing items or empty state on first paint.

FR-06: The application displays an empty state UI when no todo items exist.

FR-07: The application displays a loading state while data is being fetched/hydrated.

FR-08: The application displays an error state when a task operation fails, without disrupting the rest of the task list.

FR-09: Todo data persists across browser sessions without requiring authentication (localStorage via Zustand persist middleware).

FR-10: The system supports adding user authentication and multi-user access in a future release without requiring redesign of core task features (identity-agnostic data model).

### NonFunctional Requirements

NFR-01 — Performance: UI interactions (add, complete, delete) reflect visually within 300ms for the 95th percentile under normal local/LAN conditions.

NFR-02 — Responsiveness: Application layout is functional and readable on viewports from 375px (mobile) to 1440px (desktop). Supports the latest 2 versions of Chrome, Firefox, Safari, and Edge.

NFR-03 — Reliability: On any task operation failure, the application displays a user-facing error message and retains existing list state without requiring a page reload; no user data is lost due to transient failures.

NFR-04 — Maintainability: No source module exceeds 300 lines (architecture tightens this to 150 lines); all public functions include a purpose comment; a developer unfamiliar with the project can locate and modify any feature within one hour.

NFR-05 — Deployability: Application deploys to a standard hosting environment with a documented setup process of 5 steps or fewer.

NFR-06 — Accessibility: All interactive controls are keyboard navigable; color contrast meets WCAG 2.1 AA minimum (4.5:1 for normal text).

### Additional Requirements

AR-01: Project scaffolded with `npm create vite@latest donezo -- --template react-ts` — this is the first implementation story and must be completed before any other story.

AR-02: Zustand + Zustand `persist` middleware installed and configured as the sole state management and localStorage persistence layer (`STORAGE_KEY = 'donezo_tasks'`).

AR-03: Vitest + React Testing Library + jsdom installed and configured for unit/integration tests; minimum 70% meaningful coverage enforced in CI.

AR-04: Playwright + @axe-core/playwright installed and configured for E2E tests and automated WCAG 2.1 AA accessibility auditing; zero AA violations permitted to merge.

AR-05: Tailwind CSS v4 installed via `@tailwindcss/vite` plugin (no config file required).

AR-06: Multi-stage Dockerfile created (node:25-alpine build stage → nginx:alpine serve stage).

AR-07: `nginx.conf` configured for SPA routing (`try_files $uri $uri/ /index.html`) to prevent 404s on direct URL access.

AR-08: `docker-compose.yml` created for local container verification (app on port 3000, health check).

AR-09: GitHub Actions CI/CD workflow created: test → build → docker build/push → deploy (platform TBD: Vercel or AWS).

AR-10: `src/types.ts` created as canonical source of the `Task` interface; `src/constants.ts` created with `STORAGE_KEY`.

AR-11: `npm audit` must pass with no high/critical vulnerabilities; no `dangerouslySetInnerHTML`, no `eval()`.

### UX Design Requirements

No UX Design document was created for this project. UI decisions are deferred to implementation stories.

### FR Coverage Map

FR-01: Epic 2 — Create task (TaskInput + addTask action)
FR-02: Epic 2 — Display task with text, status, timestamp (TaskItem)
FR-03: Epic 2 — Toggle completion (TaskItem + toggleTask action)
FR-04: Epic 2 — Delete task (TaskItem + deleteTask action)
FR-05: Epic 2 — Load list on open (Zustand persist rehydration)
FR-06: Epic 3 — Empty state (TaskList conditional render)
FR-07: Epic 3 — Loading state (onRehydrateStorage callback)
FR-08: Epic 3 — Error state (ErrorBoundary + hasError flag)
FR-09: Epic 2 — Persistence across sessions (Zustand persist middleware)
FR-10: Epic 4 — Identity-agnostic architecture verification (types.ts review)

NFR-01: Epic 2 — Performance ≤300ms p95
NFR-02: Epic 4 — Responsive 375px–1440px, cross-browser
NFR-03: Epic 3 — Reliability, no data loss on failure
NFR-04: Epic 2 — Maintainability ≤150 lines per module
NFR-05: Epic 1 — Deployability ≤5 steps
NFR-06: Epic 4 — WCAG 2.1 AA accessibility

AR-01–AR-11: Epic 1 — Project foundation, tooling, Docker, CI/CD

## Epic List

### Epic 1: Project Foundation & Deployment Pipeline
Users have a live, deployed application shell — proven from scaffold to production before any feature code is written. The full development and deployment loop works end-to-end.
**FRs covered:** AR-01, AR-02, AR-03, AR-04, AR-05, AR-06, AR-07, AR-08, AR-09, AR-10, AR-11, NFR-05

### Epic 2: Core Task Management
Users can create tasks, view their list, mark tasks complete or incomplete, delete tasks, and return to find their tasks exactly where they left them.
**FRs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-09, NFR-01, NFR-04

### Epic 3: Resilient Application States
The app never breaks silently. Users always know what state the app is in — whether it's loading, empty, or something went wrong — and can continue using it without a page reload.
**FRs covered:** FR-06, FR-07, FR-08, NFR-03

### Epic 4: Accessible & Responsive Experience
The app works for every user on every device. Keyboard users, screen reader users, and mobile users all have a complete, uncompromised experience. All WCAG 2.1 AA criteria are met and verified.
**FRs covered:** FR-10, NFR-02, NFR-06

## Epic 1: Project Foundation & Deployment Pipeline

Users have a live, deployed application shell — proven from scaffold to production before any feature code is written. The full development and deployment loop works end-to-end.

### Story 1.1: Project Scaffold & Core Configuration

As a developer,
I want the project scaffolded with all dependencies installed and core configuration files in place,
So that the team has a clean, consistent starting point to build from.

**Acceptance Criteria:**

**Given** a clean working directory
**When** the scaffold and install commands are run
**Then** `npm run dev` starts a Vite dev server on localhost:5173 with no errors
**And** `src/types.ts` exists with the canonical `Task` interface (`id`, `text`, `completed`, `createdAt`)
**And** `src/constants.ts` exists with `STORAGE_KEY = 'donezo_tasks'`
**And** `vite.config.ts` has `base: '/'` and the `@tailwindcss/vite` plugin configured
**And** TypeScript strict mode is enabled and `npm run build` completes with no type errors
**And** Tailwind utility classes render correctly in the browser (verified with a test class on `App.tsx`)

### Story 1.2: Testing Infrastructure Setup

As a developer,
I want Vitest, React Testing Library, and Playwright configured with all test scripts wired into `package.json`,
So that unit, integration, and E2E tests can be written and run from day one.

**Acceptance Criteria:**

**Given** the scaffolded project from Story 1.1
**When** `npm run test` is executed
**Then** Vitest runs in watch mode with jsdom environment and no errors
**And** `npm run test:coverage` runs and produces a coverage report
**And** `npm run test:e2e` runs Playwright against a running dev server
**And** a smoke test exists for each layer (one Vitest test, one Playwright test) and both pass
**And** `playwright.config.ts` targets localhost:5173 for dev and the dist preview for CI
**And** `@axe-core/playwright` is importable in E2E test files

### Story 1.3: Docker & Container Configuration

As a developer,
I want a multi-stage Dockerfile, nginx.conf, and docker-compose.yml in place,
So that the application can be built into a container and run locally to verify the production build.

**Acceptance Criteria:**

**Given** the project from Story 1.2
**When** `docker compose up --build` is run
**Then** the application is accessible at `http://localhost:3000` with no errors
**And** navigating directly to `http://localhost:3000/` returns the React app (not a 404)
**And** the Docker image is built from `node:25-alpine` (build stage) and `nginx:alpine` (serve stage)
**And** the nginx health check (`GET /`) returns HTTP 200
**And** `.dockerignore` excludes `node_modules/`, `dist/`, and `.git/`
**And** `npm run build` output in `dist/` is correctly served by nginx

### Story 1.4: CI/CD Pipeline

As a developer,
I want a GitHub Actions workflow that runs tests, builds, and deploys the Docker image on every push to `main`,
So that every merge to main is automatically tested and deployed.

**Acceptance Criteria:**

**Given** a push to the `main` branch
**When** the GitHub Actions workflow triggers
**Then** the workflow runs `npm ci`, `npm run test:coverage` (enforcing ≥70% coverage), and `npm run build` in sequence
**And** if any step fails, the workflow stops and deployment does not proceed
**And** the Docker image is built and pushed to the configured container registry
**And** `npm audit` is run and the workflow fails on any high or critical vulnerabilities
**And** the workflow file is at `.github/workflows/deploy.yml`
**And** the deployment target (Vercel or AWS) is documented in `README.md` with setup steps ≤5

## Epic 2: Core Task Management

Users can create tasks, view their list, mark tasks complete or incomplete, delete tasks, and return to find their tasks exactly where they left them.

### Story 2.1: Zustand Store & Persistence

As a developer,
I want a Zustand store with `persist` middleware wired to localStorage,
So that all task state is managed centrally and automatically persists across browser sessions.

**Acceptance Criteria:**

**Given** the project foundation from Epic 1
**When** the store is implemented
**Then** `useTaskStore` exports `tasks`, `addTask`, `toggleTask`, and `deleteTask`
**And** `addTask(text)` creates a task with `crypto.randomUUID()` id, trimmed text, `completed: false`, and `Date.now()` createdAt — and rejects empty/whitespace-only text
**And** `toggleTask(id)` flips the `completed` boolean for the matching task
**And** `deleteTask(id)` removes the matching task from the array
**And** the store is persisted to `localStorage` under the key `donezo_tasks` via Zustand `persist` middleware
**And** closing and reopening the browser restores the task list from localStorage
**And** the store lives in `src/store/useTaskStore.ts` and does not exceed 150 lines
**And** all store actions have unit tests in `src/store/useTaskStore.test.ts`

### Story 2.2: Task Input Component

As a user,
I want an input field and submit button to add new tasks,
So that I can capture things I need to do without any friction.

**Acceptance Criteria:**

**Given** the app is open
**When** I type a task description and press Enter or click the submit button
**Then** the task appears in the list within 300ms
**And** the input field clears and returns focus, ready for the next entry
**When** I attempt to submit an empty or whitespace-only input
**Then** nothing is added to the list and the input remains focused
**And** `TaskInput.tsx` does not exceed 150 lines
**And** the input is keyboard accessible (focusable, submittable via Enter)
**And** component tests in `TaskInput.test.tsx` cover valid submit, empty submit, and input-clear behaviour

### Story 2.3: Task List & Task Item Components

As a user,
I want to see all my tasks displayed in a list with their description, completion status, and creation time,
So that I have a clear view of everything I need to do.

**Acceptance Criteria:**

**Given** the store contains one or more tasks
**When** the app renders
**Then** each task displays its text description, a completion toggle control, a delete control, and its creation timestamp
**And** the list renders on first paint without requiring any user action (FR-05)
**And** `TaskList.tsx` reads tasks from the store via `useTaskStore(s => s.tasks)` — no prop drilling
**And** `TaskItem.tsx` receives a single `Task` prop from `TaskList` and calls store actions directly
**And** neither component exceeds 150 lines
**And** component tests cover rendering with one task, rendering with multiple tasks, and correct display of all three data points

### Story 2.4: Complete & Delete Task Interactions

As a user,
I want to mark tasks as complete and delete tasks I no longer need,
So that I can track my progress and keep my list current.

**Acceptance Criteria:**

**Given** a task exists in the list
**When** I click the completion toggle
**Then** the task is visually marked as completed (e.g., strikethrough or muted styling) within 300ms
**And** the completed state persists after a page refresh
**When** I click the delete control
**Then** the task is removed from the list immediately within 300ms
**And** the task does not reappear after a page refresh
**And** E2E tests in `complete-task.spec.ts` and `delete-task.spec.ts` cover these journeys end-to-end including persistence verification

## Epic 3: Resilient Application States

The app never breaks silently. Users always know what state the app is in — whether it's loading, empty, or something went wrong — and can continue using it without a page reload.

### Story 3.1: Empty State

As a user,
I want to see a clear, friendly message when I have no tasks,
So that the app feels intentional and complete rather than broken when the list is empty.

**Acceptance Criteria:**

**Given** no tasks exist in the store
**When** the app renders or the last task is deleted
**Then** `TaskList` renders an empty state UI (not a blank screen)
**And** the empty state includes a message indicating there are no tasks and prompts the user to add one
**And** the empty state is rendered inline within `TaskList.tsx` — no separate component required
**And** the `TaskInput` remains visible and functional while the empty state is shown
**And** component tests in `TaskList.test.tsx` cover the empty state render
**And** an E2E test in `empty-state.spec.ts` covers: load app with no tasks → empty state shown; add a task → list shown; delete last task → empty state shown again

### Story 3.2: Loading State

As a user,
I want to see a loading indicator while the app is hydrating my saved tasks,
So that I know the app is working and my data is on the way.

**Acceptance Criteria:**

**Given** the app is loading and Zustand `persist` middleware is rehydrating from localStorage
**When** the hydration is in progress
**Then** a loading indicator is visible in place of the task list
**And** the loading state is managed via the `onRehydrateStorage` callback in the store (not a timer)
**And** once hydration completes, the task list (or empty state) renders immediately
**And** the loading indicator does not flash on fast devices — a minimum display threshold may be applied if needed
**And** component tests cover the loading state render in `TaskList.test.tsx`

### Story 3.3: Error Boundary & Error State

As a user,
I want the app to display a clear error message if something goes wrong, without losing my existing task list,
So that a single failure doesn't break my entire experience.

**Acceptance Criteria:**

**Given** a render error occurs within the task list
**When** `ErrorBoundary` catches the error
**Then** a user-facing error message is displayed in plain English (no stack trace)
**And** the `TaskInput` component remains visible and functional
**And** the error message does not require a page reload to dismiss — a retry or dismiss action is available
**Given** a localStorage operation fails (e.g., quota exceeded or parse error)
**When** the store detects the failure
**Then** a `hasError` flag is set in the store and surfaced to the UI as an inline error message
**And** the existing task list state is preserved and displayed
**And** no user data is lost due to the failure (NFR-03)
**And** component tests in `ErrorBoundary.test.tsx` verify the fallback UI renders on error
**And** an E2E test in `error-state.spec.ts` simulates a render failure and verifies the error message appears without breaking the input

## Epic 4: Accessible & Responsive Experience

The app works for every user on every device. Keyboard users, screen reader users, and mobile users all have a complete, uncompromised experience. All WCAG 2.1 AA criteria are met and verified.

### Story 4.1: Responsive Layout

As a user on any device,
I want the app to be fully usable on both mobile and desktop screens,
So that I can manage my tasks whether I'm at my desk or on my phone.

**Acceptance Criteria:**

**Given** the app is open on a mobile viewport (375px wide)
**When** I view the task list and input
**Then** all controls are visible, tappable, and not clipped or overflowing
**And** text is readable without horizontal scrolling
**Given** the app is open on a desktop viewport (1440px wide)
**When** I view the task list and input
**Then** the layout is appropriately constrained and not stretched uncomfortably wide
**And** all Tailwind responsive utilities are used — no hardcoded pixel values in component styles
**And** the layout is verified in the latest 2 versions of Chrome, Firefox, Safari, and Edge (NFR-02)
**And** Playwright viewport tests confirm correct rendering at 375px and 1440px

### Story 4.2: Keyboard Navigation & Accessibility

As a user who navigates by keyboard or uses a screen reader,
I want every interaction to be fully operable without a mouse,
So that the app is usable regardless of how I interact with my computer.

**Acceptance Criteria:**

**Given** the app is open
**When** I press Tab
**Then** focus moves logically through: task input → submit button → each task's toggle → each task's delete button
**And** all focus states are clearly visible (not relying on browser default outline alone)
**When** I press Enter on the submit button while the input has text
**Then** the task is added — identical behaviour to mouse click
**When** I press Enter or Space on a task's completion toggle
**Then** the task completion state is toggled
**When** I press Enter or Space on a task's delete control
**Then** the task is deleted
**And** all interactive elements use semantic HTML (`<button>`, `<input>`) — no `div` click handlers
**And** all images and icon-only controls have appropriate `aria-label` attributes
**And** the automated axe-core audit in `accessibility.spec.ts` returns zero WCAG 2.1 AA violations
**And** color contrast for all text meets the 4.5:1 minimum ratio (NFR-06)

### Story 4.3: Architecture Extensibility Verification

As a developer,
I want to verify that the data model and store are user-identity-agnostic,
So that adding authentication in v2 requires only additive changes, not a redesign.

**Acceptance Criteria:**

**Given** the completed v1 codebase
**When** the architecture is reviewed against FR-10
**Then** the `Task` interface in `src/types.ts` contains no `userId` or single-user-encoded fields
**And** the Zustand store actions (`addTask`, `toggleTask`, `deleteTask`) accept only task-level parameters — no user context baked in
**And** the localStorage key `donezo_tasks` is namespaced but not user-scoped (no user id in the key)
**And** a code review checklist item confirms: "Adding a `userId` field to `Task` and a user context to the store is sufficient to support multi-user in v2 — no structural redesign needed"
**And** this verification is documented as a comment in `src/types.ts` and `src/store/useTaskStore.ts`
