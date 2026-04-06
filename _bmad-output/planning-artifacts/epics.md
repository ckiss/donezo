---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-04-06'
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

FR-07: The application displays a loading state while data is being fetched.

FR-08: The application displays an error state when a task operation fails, without disrupting the rest of the task list.

FR-09: Todo data persists across browser sessions without requiring authentication.

FR-10: The system supports adding user authentication and multi-user access in a future release without requiring redesign of core task features (identity-agnostic data model).

FR-11: The API accepts and returns task data in a structured format for all CRUD operations: create, read (list), update (toggle completion), and delete. Status codes: 201 created, 200 success, 404 not found, 400 invalid input, 204 no content (delete).

FR-12: The API validates task input: rejects empty or whitespace-only descriptions and enforces a maximum description length.

FR-13: The API returns structured error responses including an error type and human-readable message (`{ error, message }`) for all failure cases.

FR-14: All task data persists in a database; no task data is lost due to application restart or redeployment.

### NonFunctional Requirements

NFR-01 — Performance: UI interactions (add, complete, delete) reflect visually within 300ms for the 95th percentile under normal local/LAN conditions.

NFR-02 — Responsiveness: Application layout is functional and readable on viewports from 375px (mobile) to 1440px (desktop). Supports the latest 2 versions of Chrome, Firefox, Safari, and Edge.

NFR-03 — Reliability: On any task operation failure, the application displays a user-facing error message and retains existing list state without requiring a page reload; no user data is lost due to transient failures.

NFR-04 — Maintainability: Frontend modules ≤150 lines; backend routes ≤300 lines; all public functions include a purpose comment.

NFR-05 — Deployability: Application deploys to a standard hosting environment with a documented setup process of 5 steps or fewer.

NFR-06 — Accessibility: All interactive controls are keyboard navigable; color contrast meets WCAG 2.1 AA minimum (4.5:1 for normal text).

NFR-07 — API Performance: API endpoints respond within 200ms for the 95th percentile under normal load conditions.

NFR-08 — Testability: All API endpoints are integration-testable in isolation from the frontend; API contracts are verifiable via automated test suite.

NFR-09 — Data Integrity: Database enforces data constraints (non-null description, valid timestamps); no orphaned or corrupted records result from normal CRUD operations.

### Additional Requirements

AR-01: Project scaffolded with `npm create vite@latest donezo -- --template react-ts` — first implementation story.

AR-02: Fastify 5.8.4 installed with `@fastify/cors` and `@fastify/static` for API server and static file serving.

AR-03: Prisma 7.6.0 installed with PostgreSQL provider; schema defines Task model; initial migration created.

AR-04: Zustand installed as frontend state management; store actions are async, calling API via `fetch` with relative URLs.

AR-05: Vitest + React Testing Library + jsdom for unit/component tests; Fastify `app.inject()` for API integration tests; minimum 70% coverage enforced in CI.

AR-06: Playwright + @axe-core/playwright for E2E tests and WCAG 2.1 AA accessibility auditing; zero AA violations permitted to merge.

AR-07: Tailwind CSS v4 installed via `@tailwindcss/vite` plugin.

AR-08: Multi-stage Dockerfile: node:25-alpine build → node:25-alpine runtime (Fastify serves both API and static frontend).

AR-09: Docker Compose with app container + PostgreSQL container; named volume for data persistence.

AR-10: GitHub Actions CI/CD: lint → test (with PostgreSQL service container) → build → docker build/push → deploy.

AR-11: `src/types.ts` as frontend Task interface source; Prisma-generated types for backend; never import `@prisma/client` in frontend.

AR-12: `server/db.ts` as Prisma client singleton; never instantiate PrismaClient in route files.

AR-13: Vite dev proxy forwards `/api/*` to Fastify on localhost:3000; production: Fastify serves both.

AR-14: Pessimistic updates for all store mutations — await API response before updating local state.

AR-15: `npm audit` must pass with no high/critical vulnerabilities; no `dangerouslySetInnerHTML`, no `eval()`.

AR-16: Test database pattern: `DATABASE_URL` env var override; `prisma migrate deploy` before test suite; truncate tables between tests.

### UX Design Requirements

No UX Design document was created for this project. UI decisions are deferred to implementation stories.

### FR Coverage Map

FR-01: Epic 3 — Create task (TaskInput + API)
FR-02: Epic 3 — Display task with text, status, timestamp
FR-03: Epic 3 — Toggle completion (TaskItem + API)
FR-04: Epic 3 — Delete task (TaskItem + API)
FR-05: Epic 3 — Load list on open (fetchTasks on mount)
FR-06: Epic 4 — Empty state (TaskList conditional render)
FR-07: Epic 4 — Loading state (isLoading flag)
FR-08: Epic 4 — Error state (ErrorBoundary + error flag)
FR-09: Epic 3 — Persistence across sessions (database via API)
FR-10: Epic 5 — Identity-agnostic architecture verification
FR-11: Epic 2 — API CRUD contract (all 4 endpoints)
FR-12: Epic 2 — API input validation
FR-13: Epic 2 — Structured error responses
FR-14: Epic 2 — Database persistence

NFR-01: Epic 3 — UI performance ≤300ms p95
NFR-02: Epic 5 — Responsive 375px–1440px
NFR-03: Epic 4 — Reliability, no data loss
NFR-04: Epic 3 — Maintainability ≤150/300 lines
NFR-05: Epic 1 — Deployability ≤5 steps
NFR-06: Epic 5 — WCAG 2.1 AA accessibility
NFR-07: Epic 2 — API performance ≤200ms p95
NFR-08: Epic 1 — Testability (test infra setup)
NFR-09: Epic 2 — Data integrity constraints

AR-01–AR-16: Epic 1 — All architectural requirements

## Epic List

### Epic 1: Project Foundation & Backend Setup
The development environment, backend server, database, and deployment pipeline are working end-to-end — from scaffold to running Docker Compose with PostgreSQL — before any feature code is written.
**FRs covered:** AR-01–AR-16, NFR-05, NFR-08

### Epic 2: Task API & Database
The API fully supports creating, listing, updating, and deleting tasks with validated input, structured error responses, and database-backed persistence. All endpoints are integration-tested in isolation.
**FRs covered:** FR-11, FR-12, FR-13, FR-14, NFR-07, NFR-09

### Epic 3: Core Task Management
Users can create tasks, view their list, mark tasks complete or incomplete, delete tasks, and return to find their tasks exactly as they left them — all powered by the API.
**FRs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-09, NFR-01, NFR-04

### Epic 4: Resilient Application States
The app never breaks silently. Users always know what's happening — whether tasks are loading, the list is empty, or something went wrong — and can continue without a page reload.
**FRs covered:** FR-06, FR-07, FR-08, NFR-03

### Epic 5: Accessible & Responsive Experience
The app works for every user on every device. Keyboard, screen reader, and mobile users all have a complete experience. WCAG 2.1 AA criteria are met and verified.
**FRs covered:** FR-10, NFR-02, NFR-06

## Epic 1: Project Foundation & Backend Setup

The development environment, backend server, database, and deployment pipeline are working end-to-end — from scaffold to running Docker Compose with PostgreSQL — before any feature code is written.

### Story 1.1: Project Scaffold & Core Configuration

As a developer,
I want the project scaffolded with all frontend and backend dependencies installed and core configuration in place,
So that the team has a clean, consistent starting point to build from.

**Acceptance Criteria:**

**Given** a clean working directory
**When** the scaffold and install commands are run
**Then** `npm run dev` starts Vite on :5173 and Fastify on :3000 concurrently with no errors
**And** `src/types.ts` exists with the frontend `Task` interface (`id: string`, `text: string`, `completed: boolean`, `createdAt: string`)
**And** `vite.config.ts` has `base: '/'`, the `@tailwindcss/vite` plugin, and proxy config forwarding `/api/*` to `http://localhost:3000`
**And** `server/index.ts` exists with a Fastify app that registers `@fastify/cors` and serves a `GET /api/health` returning `{ status: "ok" }`
**And** `server/db.ts` exports a singleton Prisma client instance
**And** TypeScript strict mode is enabled and `npm run build` completes with no type errors
**And** Tailwind utility classes render correctly in the browser

### Story 1.2: Database Setup & Prisma Configuration

As a developer,
I want PostgreSQL configured with Prisma ORM and the Task schema migrated,
So that the database is ready for API development.

**Acceptance Criteria:**

**Given** the project from Story 1.1
**When** `npx prisma migrate dev` is run
**Then** the `Task` table is created in PostgreSQL with columns: `id` (UUID, primary key), `text` (non-null string), `completed` (boolean, default false), `createdAt` (timestamp, default now)
**And** `prisma/schema.prisma` defines the Task model matching the architecture spec
**And** `.env` contains `DATABASE_URL` pointing to the local PostgreSQL instance
**And** `.env.example` exists with a placeholder `DATABASE_URL`
**And** `server/db.ts` connects to PostgreSQL via the Prisma client singleton
**And** a simple query (`prisma.task.findMany()`) executes successfully from a test script

### Story 1.3: Testing Infrastructure Setup

As a developer,
I want Vitest, React Testing Library, Playwright, and API integration test patterns configured,
So that unit, component, API integration, and E2E tests can be written from day one.

**Acceptance Criteria:**

**Given** the project from Story 1.2
**When** `npm run test` is executed
**Then** Vitest runs in watch mode with jsdom environment and no errors
**And** `npm run test:coverage` produces a coverage report
**And** `npm run test:e2e` runs Playwright against a running dev server
**And** a smoke test exists for each layer: one Vitest unit test, one RTL component test, one Fastify inject API test, and one Playwright E2E test — all pass
**And** API integration tests use a test database (`donezo_test`) via `DATABASE_URL` override
**And** `prisma migrate deploy` runs before the API test suite
**And** `@axe-core/playwright` is importable in E2E test files

### Story 1.4: Docker & Container Configuration

As a developer,
I want a Dockerfile and docker-compose.yml with PostgreSQL,
So that the full stack can be built and run locally to verify the production setup.

**Acceptance Criteria:**

**Given** the project from Story 1.3
**When** `docker compose up --build` is run
**Then** the app is accessible at `http://localhost:3000` with no errors
**And** `GET /api/health` returns `{ status: "ok" }`
**And** the Fastify server serves the built frontend at `http://localhost:3000/`
**And** PostgreSQL is running in a separate container with a named volume for data persistence
**And** the Dockerfile uses node:25-alpine for both build and runtime stages
**And** `.dockerignore` excludes `node_modules/`, `dist/`, and `.git/`
**And** Prisma migrations run automatically on container startup

### Story 1.5: CI/CD Pipeline

As a developer,
I want a GitHub Actions workflow that lints, tests, builds, and deploys on every push to main,
So that every merge is automatically validated and deployed.

**Acceptance Criteria:**

**Given** a push to the `main` branch
**When** the GitHub Actions workflow triggers
**Then** the workflow runs lint, `npm run test:coverage` (enforcing ≥70% coverage), and `npm run build` in sequence
**And** API integration tests run against a PostgreSQL service container in CI
**And** if any step fails, the workflow stops and deployment does not proceed
**And** the Docker image is built and pushed to the configured container registry
**And** `npm audit` is run and the workflow fails on any high or critical vulnerabilities
**And** the workflow file is at `.github/workflows/deploy.yml`
**And** deployment steps ≤5 are documented in `README.md` (NFR-05)

## Epic 2: Task API & Database

The API fully supports creating, listing, updating, and deleting tasks with validated input, structured error responses, and database-backed persistence. All endpoints are integration-tested in isolation.

### Story 2.1: Task CRUD API Endpoints

As a developer,
I want REST API endpoints for creating, listing, updating, and deleting tasks,
So that the frontend has a complete backend contract to build against.

**Acceptance Criteria:**

**Given** the Fastify server and Prisma database from Epic 1
**When** `GET /api/tasks` is called
**Then** it returns `200` with a JSON array of all tasks ordered by `createdAt` descending

**Given** a valid request body `{ text: "Buy groceries" }`
**When** `POST /api/tasks` is called
**Then** it returns `201` with the created `Task` object including `id`, `text`, `completed: false`, and `createdAt` as ISO 8601 string
**And** the task is persisted in PostgreSQL (FR-14)

**Given** an existing task with `completed: false`
**When** `PATCH /api/tasks/:id` is called with `{ completed: true }`
**Then** it returns `200` with the updated `Task` object reflecting `completed: true`

**Given** an existing task
**When** `DELETE /api/tasks/:id` is called
**Then** it returns `204 No Content` with empty body
**And** the task is removed from the database

**And** all routes live in `server/routes/tasks.ts` and do not exceed 300 lines
**And** route handlers import `prisma` from `server/db.ts` — never instantiate PrismaClient locally

### Story 2.2: Input Validation & Error Responses

As a developer,
I want the API to validate input and return structured error responses for all failure cases,
So that the frontend receives consistent, predictable error information.

**Acceptance Criteria:**

**Given** a `POST /api/tasks` request with empty or whitespace-only `text`
**When** the request is processed
**Then** it returns `400` with `{ error: "VALIDATION_ERROR", message: "Task text is required" }` (FR-12)

**Given** a `POST /api/tasks` request with `text` exceeding the maximum length
**When** the request is processed
**Then** it returns `400` with `{ error: "VALIDATION_ERROR", message: "..." }` (FR-12)

**Given** a `PATCH /api/tasks/:id` or `DELETE /api/tasks/:id` request with a non-existent id
**When** the request is processed
**Then** it returns `404` with `{ error: "NOT_FOUND", message: "Task not found" }`

**Given** an unhandled server error occurs
**When** the Fastify error handler catches it
**Then** it returns `500` with `{ error: "INTERNAL_ERROR", message: "An unexpected error occurred" }` (FR-13)

**And** Fastify JSON Schema validation is used on POST and PATCH request bodies
**And** `text.trim()` is applied server-side before storage
**And** all error responses follow the `{ error: string, message: string }` contract

### Story 2.3: API Integration Tests

As a developer,
I want comprehensive integration tests for all API endpoints,
So that the API contract is verified automatically and regressions are caught early.

**Acceptance Criteria:**

**Given** the test database (`donezo_test`) and Fastify inject test pattern from Story 1.3
**When** the API integration test suite runs
**Then** tests cover all CRUD operations: create (201), list (200), update (200), delete (204)
**And** tests cover all validation cases: empty text (400), whitespace text (400), max length exceeded (400)
**And** tests cover all error cases: not found (404), server error (500)
**And** tests verify database state after each operation (task exists/doesn't exist in DB)
**And** tests verify response body shape matches the API contract exactly
**And** each test file truncates tables in `beforeEach` for isolation
**And** tests live in `server/routes/tasks.test.ts`
**And** all tests pass with `npm run test` (NFR-08)

## Epic 3: Core Task Management

Users can create tasks, view their list, mark tasks complete or incomplete, delete tasks, and return to find their tasks exactly as they left them — all powered by the API.

### Story 3.1: Zustand Store with Async API Actions

As a developer,
I want a Zustand store that manages task state through API calls,
So that all frontend components share a single, API-backed source of truth.

**Acceptance Criteria:**

**Given** the API endpoints from Epic 2
**When** the store is implemented
**Then** `useTaskStore` exports `tasks`, `isLoading`, `error`, `fetchTasks`, `addTask`, `toggleTask`, and `deleteTask`
**And** `fetchTasks()` calls `GET /api/tasks` and replaces the `tasks` array with the response
**And** `addTask(text)` trims and rejects empty/whitespace text client-side, then calls `POST /api/tasks` and appends the returned `Task` to the local array
**And** `toggleTask(id)` sends `PATCH /api/tasks/:id` with `{ completed: !current }` and replaces the matching task with the API response
**And** `deleteTask(id)` calls `DELETE /api/tasks/:id` and removes the task by `id` from local state after receiving 204
**And** all mutations use pessimistic updates — await API response before updating local state (AR-14)
**And** on fetch/network failure, store sets `error` to `"Unable to reach server. Please try again."` following the `{ error, message }` pattern
**And** all API calls use relative URLs (`/api/tasks`)
**And** the store lives in `src/store/useTaskStore.ts` and does not exceed 150 lines
**And** unit tests in `src/store/useTaskStore.test.ts` cover all actions, error handling, and state transitions

### Story 3.2: Task Input Component

As a user,
I want an input field and submit button to add new tasks,
So that I can capture things I need to do without any friction.

**Acceptance Criteria:**

**Given** the app is open
**When** I type a task description and press Enter or click the submit button
**Then** the task appears in the list within 300ms (NFR-01)
**And** the input field clears and returns focus, ready for the next entry
**When** I attempt to submit an empty or whitespace-only input
**Then** nothing is added to the list and the input remains focused
**And** `TaskInput.tsx` does not exceed 150 lines
**And** the input is keyboard accessible (focusable, submittable via Enter)
**And** component tests in `TaskInput.test.tsx` cover valid submit, empty submit, and input-clear behaviour

### Story 3.3: Task List & Task Item Components

As a user,
I want to see all my tasks displayed in a list with their description, completion status, and creation time,
So that I have a clear view of everything I need to do.

**Acceptance Criteria:**

**Given** the store contains one or more tasks
**When** the app renders
**Then** each task displays its text description, a completion toggle control, a delete control, and its creation timestamp (FR-02)
**And** `fetchTasks` is called on app mount in `<App />` (FR-05)
**And** `TaskList.tsx` reads `tasks`, `isLoading`, and `error` from the store via `useTaskStore` — no prop drilling
**And** `TaskItem.tsx` receives a single `Task` prop from `TaskList` and calls store actions directly
**And** neither component exceeds 150 lines
**And** component tests cover rendering with one task, multiple tasks, and correct display of all data points

### Story 3.4: Complete & Delete Task Interactions

As a user,
I want to mark tasks as complete and delete tasks I no longer need,
So that I can track my progress and keep my list current.

**Acceptance Criteria:**

**Given** a task exists in the list
**When** I click the completion toggle
**Then** the task is visually marked as completed (e.g., strikethrough or muted styling) within 300ms (NFR-01)
**And** the completed state persists after a page refresh (FR-03, FR-09)
**When** I click the delete control
**Then** the task is removed from the list within 300ms (NFR-01)
**And** the task does not reappear after a page refresh (FR-04)
**And** E2E tests in `complete-task.spec.ts` and `delete-task.spec.ts` cover these journeys end-to-end including persistence verification via page refresh
**And** E2E test in `add-task.spec.ts` covers the full create journey

## Epic 4: Resilient Application States

The app never breaks silently. Users always know what's happening — whether tasks are loading, the list is empty, or something went wrong — and can continue without a page reload.

### Story 4.1: Empty State

As a user,
I want to see a clear, friendly message when I have no tasks,
So that the app feels intentional and complete rather than broken when the list is empty.

**Acceptance Criteria:**

**Given** no tasks exist in the database
**When** the app renders or the last task is deleted
**Then** `TaskList` renders an empty state UI (not a blank screen) (FR-06)
**And** the empty state includes a message indicating there are no tasks and prompts the user to add one
**And** the empty state is rendered inline within `TaskList.tsx` — no separate component required
**And** the `TaskInput` remains visible and functional while the empty state is shown
**And** component tests in `TaskList.test.tsx` cover the empty state render
**And** an E2E test in `empty-state.spec.ts` covers: load app with no tasks → empty state shown; add a task → list shown; delete last task → empty state shown again

### Story 4.2: Loading State

As a user,
I want to see a loading indicator while the app is fetching my tasks,
So that I know the app is working and my data is on the way.

**Acceptance Criteria:**

**Given** the app is loading and `fetchTasks` is in progress
**When** `isLoading` is `true` in the store
**Then** a loading indicator is visible in place of the task list (FR-07)
**And** once the API responds, the task list (or empty state) renders immediately
**And** `TaskList.tsx` checks `isLoading` before rendering tasks or empty state
**And** component tests cover the loading state render in `TaskList.test.tsx`

### Story 4.3: Error Boundary & Error State

As a user,
I want the app to display a clear error message if something goes wrong, without losing my existing task list,
So that a single failure doesn't break my entire experience.

**Acceptance Criteria:**

**Given** a render error occurs within the task list
**When** `ErrorBoundary` catches the error
**Then** a user-facing error message is displayed in plain English (no stack trace) (FR-08)
**And** the `TaskInput` component remains visible and functional

**Given** an API call fails (network error or server error)
**When** the store catches the error
**Then** the `error` state is set and an inline error message is displayed
**And** the existing task list state is preserved and displayed (NFR-03)
**And** the error clears on the next successful action

**And** `ErrorBoundary.tsx` is a class component wrapping `<TaskList />`
**And** component tests in `ErrorBoundary.test.tsx` verify the fallback UI renders on error
**And** an E2E test in `error-state.spec.ts` simulates an API failure and verifies the error message appears without breaking the input or existing list

## Epic 5: Accessible & Responsive Experience

The app works for every user on every device. Keyboard, screen reader, and mobile users all have a complete experience. WCAG 2.1 AA criteria are met and verified.

### Story 5.1: Responsive Layout

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

### Story 5.2: Keyboard Navigation & Accessibility

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
**And** all icon-only controls have appropriate `aria-label` attributes
**And** the automated axe-core audit in `accessibility.spec.ts` returns zero WCAG 2.1 AA violations
**And** color contrast for all text meets the 4.5:1 minimum ratio (NFR-06)

### Story 5.3: Architecture Extensibility Verification

As a developer,
I want to verify that the data model and API are user-identity-agnostic,
So that adding authentication in v2 requires only additive changes, not a redesign.

**Acceptance Criteria:**

**Given** the completed v1 codebase
**When** the architecture is reviewed against FR-10
**Then** the `Task` model in `prisma/schema.prisma` contains no `userId` column or single-user-encoded fields
**And** the frontend `Task` interface in `src/types.ts` contains no user-specific fields
**And** API routes in `server/routes/tasks.ts` accept no user context — all tasks are returned regardless
**And** the Zustand store actions accept only task-level parameters — no user context baked in
**And** a code review checklist confirms: "Adding a `userId` column, auth middleware, and filtering tasks by user is sufficient for multi-user in v2 — no structural redesign needed"
**And** this verification is documented as a comment in `prisma/schema.prisma` and `server/routes/tasks.ts`
