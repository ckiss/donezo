---

## stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-06'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd-donezo.md'
  - '_bmad-output/planning-artifacts/product-brief-donezo.md'
workflowType: 'architecture'
project_name: 'donezo'
user_name: 'Cris'
date: '2026-04-01'
editHistory:
  - date: '2026-04-06'
    changes: 'Added backend architecture: Fastify 5.8.4 + PostgreSQL + Prisma 7.6.0. Updated context (14 FRs, 9 NFRs), decisions (API contract, database, backend framework), patterns (10 consistency fixes from elicitation), project structure (server/ directory, prisma/), and validation. Transition from localStorage-only to full client-server architecture.'

# Architecture Decision Document

*This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together.*

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
14 FRs covering five capability areas:

- Core CRUD: create, view, complete/toggle, delete (FR-01–04)
- Application lifecycle states: initial load, empty state, loading state, error state (FR-05–08)
- Persistence: browser session durability without authentication (FR-09)
- Extensibility: identity-agnostic design enabling future auth layer (FR-10)
- Backend API: CRUD contract, input validation, structured error responses, database persistence (FR-11–14)

**Non-Functional Requirements:**

- Performance: UI interactions ≤300ms for p95 under normal local/LAN conditions (NFR-01)
- Responsiveness: functional at 375px–1440px; latest 2 versions of Chrome, Firefox, Safari, Edge (NFR-02)
- Reliability: error recovery without page reload; no data loss from transient failures (NFR-03)
- Maintainability: modules ≤300 lines; all public functions documented; 1-hour orientation target (NFR-04)
- Deployability: ≤5 steps to a standard hosting environment (NFR-05)
- Accessibility: WCAG 2.1 AA — keyboard navigable, ≥4.5:1 contrast (NFR-06)
- API Performance: endpoints ≤200ms for p95 under normal load (NFR-07)
- Testability: API endpoints integration-testable in isolation from frontend (NFR-08)
- Data Integrity: database enforces non-null description, valid timestamps; no orphaned records (NFR-09)

**Scale & Complexity:**

- Primary domain: full-stack web (SPA frontend + REST API backend + database)
- Complexity level: Low-Medium — backend added but no auth, no multi-tenancy, no integrations
- Estimated architectural components: 8–10 (previous frontend components + API layer, database, server, API tests)

### Technical Constraints & Dependencies

- Primary persistence: database (simple DB — SQLite recommended for zero-infrastructure alignment)
- Frontend may retain localStorage as offline cache, but database is source of truth
- No authentication in v1 — data model must remain user-identity-agnostic (FR-10)
- REST API required for all task operations (FR-11)
- Data must survive application restart/redeployment (FR-14) — localStorage alone cannot satisfy this
- Free/open-source project — infrastructure cost is a real constraint
- Browser support: evergreen (latest 2 versions of 4 major browsers)

### Cross-Cutting Concerns Identified

1. **Error handling** — spans client AND server; API returns structured error responses (FR-13), frontend displays them without disrupting existing list state
2. **Input validation** — dual-layer: server-side is authoritative (FR-12), client-side is UX optimization
3. **Data model consistency** — shared between frontend TypeScript types and database schema; must stay in sync
4. **Accessibility** — WCAG 2.1 AA applies to every interactive element; must be designed in from the start
5. **Responsive layout** — all components must adapt across the full 375px–1440px range
6. **Data model identity-agnosticism** — storage schema must not bake in single-user assumptions; `userId` column should be reserved/optional from day one
7. **Performance budget** — 300ms p95 for UI interactions, 200ms p95 for API responses

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — React SPA frontend + Fastify REST API backend + PostgreSQL database.

### Starter Options Considered

- **Vite + React + TypeScript** (`react-ts` template) — largest OSS ecosystem, highest contribution accessibility, excellent TypeScript + Tailwind support
- **Vite + Vue + TypeScript** — solid option, slightly smaller contributor pool for OSS reference project
- **Vite + Svelte + TypeScript** — smallest bundles, but smaller contributor ecosystem reduces open-source accessibility

### Selected Starter: Vite + React + TypeScript

**Rationale for Selection:**
Donezo is an open-source reference implementation. React maximises contribution accessibility and ecosystem reach. For a 4-action CRUD SPA the complexity overhead is negligible. Tailwind CSS added manually via the `@tailwindcss/vite` plugin (no config file required in Tailwind v4).

**Initialization Command:**

```bash
npm create vite@latest donezo -- --template react-ts
cd donezo
npm install
npm install tailwindcss @tailwindcss/vite
```

**Vite Base Path:**

```ts
base: '/'  // root — works for Vercel, AWS, and Docker/nginx
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript, strict mode

**Styling Solution:** Tailwind CSS v4 via `@tailwindcss/vite` plugin

**Build Tooling:** Vite 8 (current: 8.0.3) + Rolldown (Rust-based, 10–30× faster builds)

**Testing Framework:** Not included — Vitest added separately (recommended for Vite-native test execution)

**Code Organization:** `src/` flat structure; components extracted per feature

**Development Experience:** HMR, fast refresh, TypeScript type checking, ESLint

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Data model schema — defines storage contract (database + API)
- Backend framework — shapes API layer (Fastify)
- Database + ORM — defines persistence layer (PostgreSQL + Prisma)
- State management library — shapes frontend component interactions (Zustand)
- API contract — defines client-server communication

**Important Decisions (Shape Architecture):**

- Testing stack — gates CI quality gates
- Deployment pipeline — required for container hosting

**Deferred Decisions (Post-MVP):**

- Authentication — v2; data model is identity-agnostic by design
- Routing — single-view app in v1; add React Router when multi-view needed

### Data Architecture

**Database: PostgreSQL** (via Prisma ORM 7.6.0)

**Prisma Schema (source of truth):**

```prisma
model Task {
  id        String   @id @default(uuid())
  text      String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**TypeScript Interface (generated by Prisma, used in frontend):**

```ts
interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: string // ISO 8601 from API; Date in Prisma
}
```

- **Storage:** PostgreSQL — data survives application restart/redeployment (FR-14)
- **ORM:** Prisma 7.6.0 — type-safe queries, schema migrations, database constraint enforcement (NFR-09)
- **Rationale:** User-specified PostgreSQL; Prisma provides migration tooling, type generation, and enforces non-null constraints at the database level
- **Migration:** Prisma Migrate handles schema evolution; initial migration creates `Task` table
- **Identity-agnosticism:** No `userId` column in v1; adding auth in v2 requires adding a column + foreign key, not restructuring

### Authentication & Security

- **v1:** No authentication. Single-user access to shared database.
- **Identity-agnosticism:** Data model carries no single-user assumptions — no encoded userId, no auth-specific fields. Adding auth in v2 requires adding a field, not restructuring.
- **API Security:** CORS configured via `@fastify/cors` (11.2.0) to allow frontend origin only

### Backend Architecture

**Framework: Fastify 5.8.4**

- TypeScript-native, built-in JSON Schema validation (covers FR-12), high performance
- Plugins: `@fastify/cors` for frontend-backend communication
- Rationale: Faster than Express, built-in validation/serialization aligns with FR-12 requirements, excellent TypeScript support

**API Contract (REST + JSON):**

| Method | Endpoint | FR | Description |
|--------|----------|-----|-------------|
| GET | `/api/tasks` | FR-11 | List all tasks |
| POST | `/api/tasks` | FR-11, FR-12 | Create task (validates input) |
| PATCH | `/api/tasks/:id` | FR-11 | Toggle completion |
| DELETE | `/api/tasks/:id` | FR-11 | Delete task |
| GET | `/api/health` | — | Health check for deployment |

**Validation (FR-12):** Fastify JSON Schema validation on POST/PATCH — rejects empty/whitespace-only descriptions, enforces max length at the route level. Server-side validation is authoritative; client-side validation is UX optimization only.

**Error Response Contract (FR-13):**

```ts
interface ApiError {
  error: string    // machine-readable error type: VALIDATION_ERROR, NOT_FOUND, INTERNAL_ERROR
  message: string  // human-readable description
}
```

Status codes: 201 (created), 200 (success), 400 (validation error), 404 (not found), 500 (server error)

### Frontend Architecture

**State Management: Zustand**

- Single store with task slice: `tasks`, `isLoading`, `error`, `fetchTasks`, `addTask`, `toggleTask`, `deleteTask`
- Store actions are **async** — call API endpoints via `fetch`; no direct localStorage
- `fetchTasks` called on app mount to hydrate from API (FR-05)
- Loading state (FR-07) driven by `isLoading` flag during API calls
- Error state (FR-08) driven by `error` flag when API returns error responses
- Rationale: Zustand remains the right choice — lower boilerplate than useReducer + Context; async actions are clean with Zustand's `set` pattern; TypeScript-native

**Component Architecture:**

- `<App />` — root, calls `fetchTasks` on mount
- `<TaskInput />` — controlled input + submit (FR-01)
- `<TaskList />` — renders list, empty state, or loading state (FR-05, FR-06, FR-07)
- `<TaskItem />` — single task row with complete/delete controls (FR-02–04)
- `<ErrorBoundary />` — catches render errors (FR-08)

**Routing:** None in v1 — single-view SPA

### Infrastructure & Deployment

**Hosting:** Docker Compose — app container (Fastify serves both API and static frontend) + PostgreSQL container

- Fastify serves built frontend assets from `dist/` and API from `/api/*`
- Single application container simplifies deployment; no separate nginx needed
- `base: '/'` in `vite.config.ts`
- Multi-stage Docker build: Node 25 Alpine for build → Node 25 Alpine for runtime (Fastify needs Node)
- Health check endpoint: `GET /api/health` returns 200
- PostgreSQL container with named volume for data persistence

**CI/CD:** GitHub Actions

- Trigger: push to `main`
- Steps: install → lint → test (unit + integration) → build → docker build → push to registry → deploy
- Integration tests run against a PostgreSQL service container in CI

**Testing Stack:** Four-layer testing pyramid

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Store actions, utility functions |
| Component | Vitest + React Testing Library | Component behaviour, rendering |
| API Integration | Vitest + Fastify inject | API endpoints against test database (NFR-08) |
| E2E | Playwright | Full user journeys in a real browser |

- **Vitest:** Vite-native, Jest-compatible API; runs in jsdom (frontend) and Node (backend)
- **RTL:** component interaction tests aligned to user behaviour
- **Fastify inject:** Fastify's built-in `app.inject()` for testing API routes without starting a server — tests run against a test PostgreSQL database
- **Playwright:** automates browser for E2E journeys; covers create, complete, delete, empty state, error handling across Chrome, Firefox, Safari
- **Coverage target:** minimum 70% meaningful coverage; all CRUD operations + API endpoints + state transitions must be covered
- **axe-core via Playwright:** accessibility audit automated in CI (WCAG 2.1 AA gate)

### Decision Impact Analysis

**Implementation Sequence:**

1. Scaffold (`npm create vite@latest`) + install deps (Tailwind, Zustand, Vitest, RTL, Fastify, Prisma, Playwright)
2. Prisma schema + PostgreSQL setup + initial migration
3. Fastify server with API routes (CRUD endpoints + validation + error handling)
4. API integration tests (Vitest + Fastify inject)
5. Zustand store with async API actions (replaces localStorage persist)
6. Core components (TaskInput → TaskList → TaskItem)
7. Error boundary + loading/empty states
8. Docker Compose (app + PostgreSQL)
9. GitHub Actions workflow (with PostgreSQL service container)
10. Accessibility pass (WCAG 2.1 AA)

**Cross-Component Dependencies:**

- All frontend components read/write through Zustand store — no prop drilling
- Zustand store calls Fastify API endpoints — store is a thin API client layer
- Fastify routes call Prisma client — Prisma owns the database contract
- Prisma schema is the single source of truth for data shape; TypeScript types derived from it
- Error boundary wraps TaskList to isolate render failures from input

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

10 areas where agents could diverge without explicit rules:
file naming · component structure · store action naming · error handling approach · test co-location · Tailwind class organisation · API route structure · database naming · validation layer · API response format

### Naming Patterns

**Frontend Files & Directories:**

- React components: PascalCase filename matching component name — `TaskItem.tsx`
- Non-component modules: camelCase — `useTaskStore.ts`
- Test files: co-located, `.test.` suffix — `TaskItem.test.tsx`
- Types/interfaces: `src/types.ts` for shared frontend types

**Backend Files & Directories:**

- Route modules: camelCase — `tasks.ts`, `health.ts`
- Prisma schema: `prisma/schema.prisma` (Prisma convention)
- Backend entry: `server/index.ts`
- Route files: `server/routes/tasks.ts`
- Database singleton: `server/db.ts`
- Test files: co-located `.test.ts` suffix — `server/routes/tasks.test.ts`

**Database Naming (Prisma):**

- Models: PascalCase singular — `Task` (Prisma convention)
- Columns: camelCase — `createdAt` (Prisma maps to `created_at` in PostgreSQL)
- Table name in PostgreSQL: lowercase plural `tasks` (Prisma default mapping)

**API Naming:**

- Endpoints: plural nouns — `/api/tasks`, not `/api/task`
- Route parameters: `:id` format — `/api/tasks/:id`
- JSON fields: camelCase — `{ createdAt: "..." }` matching TypeScript conventions

**Code Conventions:**

- Components: PascalCase — `TaskItem`, `TaskList`, `TaskInput`
- Functions/variables: camelCase — `addTask`, `toggleTask`, `isLoading`
- Constants: SCREAMING_SNAKE_CASE — `API_BASE`, `MAX_TEXT_LENGTH`
- Types/Interfaces: PascalCase — `Task`, `TaskStore`, `ApiError`
- Boolean variables: `is`/`has` prefix — `isCompleted`, `hasError`, `isLoading`

**Zustand Actions:**

- CRUD verbs: `fetchTasks`, `addTask`, `toggleTask`, `deleteTask` (not `createTask`, `updateTask`, `removeTask`)
- Consistency rule: action names match FR verb language throughout

### Structure Patterns

**Project Organisation:**

```
src/                            # Frontend source
  components/                   # One file per component; co-located tests
    TaskInput.tsx
    TaskInput.test.tsx
    TaskList.tsx
    TaskList.test.tsx
    TaskItem.tsx
    TaskItem.test.tsx
    ErrorBoundary.tsx
    ErrorBoundary.test.tsx
  store/
    useTaskStore.ts             # Zustand store with async API actions
    useTaskStore.test.ts
  types.ts                      # Frontend Task interface (createdAt: string)
  App.tsx
  main.tsx
server/                         # Backend source
  index.ts                      # Fastify app setup, plugin registration, static file serving
  db.ts                         # Prisma client singleton
  routes/
    tasks.ts                    # CRUD route handlers (FR-11–14)
    tasks.test.ts               # API integration tests (Vitest + Fastify inject)
    health.ts                   # Health check endpoint
prisma/
  schema.prisma                 # Database schema (source of truth for data model)
```

- No `index.ts` barrel files — import directly from the source file
- No nested `components/` subdirectories in v1 (too few components to warrant it)
- Backend and frontend are separate directory trees; never import across the boundary

### Format Patterns

**Task Data Shape — Two Intentionally Different Types:**

**Backend type** (Prisma-generated from `@prisma/client`):
```ts
// Auto-generated — createdAt is Date
{ id: string, text: string, completed: boolean, createdAt: Date }
```

**Frontend type** (defined in `src/types.ts`):
```ts
interface Task {
  id: string
  text: string        // trimmed before storage; never empty string
  completed: boolean
  createdAt: string   // ISO 8601 from JSON serialization
}
```

- These are intentionally different — `Date` on server, `string` on client
- **Never** import `@prisma/client` in frontend code
- Fastify's default JSON serialization converts `Date` → ISO 8601 string automatically; no manual `.toISOString()` in route handlers

**API Response Format:**

- Success: return data directly — `Task` or `Task[]` (no wrapper object)
- Error: `{ error: string, message: string }` with appropriate HTTP status code
- No envelope pattern — keep it simple for a CRUD API

**API URL Pattern:**

- Frontend always uses **relative URLs**: `fetch('/api/tasks')` — no hardcoded host/port
- Development: Vite proxy forwards `/api/*` to Fastify (`http://localhost:3000`)
- Production: Fastify serves both static assets and API from same origin

### State Management Patterns

**Zustand Store Shape:**

```ts
interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  fetchTasks: () => Promise<void>
  addTask: (text: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}
```

- Store lives in `src/store/useTaskStore.ts` — one file, one store
- Components access store via `useTaskStore` hook — no prop drilling of tasks
- All actions are **async** — each calls the corresponding API endpoint via `fetch`
- Immutable updates only — use Zustand's `set` with spread, never mutate state directly

**Update Strategy: Pessimistic (await API response) for all mutations in v1.**
- Every store action awaits the API response before updating local state
- No optimistic updates, no rollback logic
- Rationale: 200ms API target fits within 300ms UI budget; simpler implementation; server is always source of truth

**Store Mutation Rules:**
- `fetchTasks`: replaces entire `tasks` array with `GET` response — used only on mount
- `addTask`: appends the `Task` returned by `POST` response to local `tasks` array — no re-fetch
- `toggleTask`: replaces the matching task in the array with the full `Task` from `PATCH` response — server response is source of truth
- `deleteTask`: removes by `id` from local array after receiving 204

### Communication Patterns

**Component → Store:**

- Components call store actions directly: `const { addTask } = useTaskStore()`
- Components select minimal state slices: `const tasks = useTaskStore(s => s.tasks)`
- No intermediate event bus or custom hooks wrapping the store in v1

**Loading & Empty States:**

- `isLoading === true` → `<TaskList />` renders loading indicator
- `!isLoading && tasks.length === 0` → empty state
- `fetchTasks` called once on app mount in `<App />`

### Process Patterns

**Error Handling (dual-layer):**

- **Server:** Fastify error handler returns `{ error, message }` with status code; validation errors return 400; not-found returns 404; unhandled errors return 500
- **Client:** Zustand store catches fetch errors, sets `error` state; `<TaskList />` renders error inline
- **Network failures:** When `fetch` throws (network down, timeout), the store constructs: `{ error: "NETWORK_ERROR", message: "Unable to reach server. Please try again." }` — follows the same `{ error, message }` shape as API errors so components handle both identically
- Render errors: caught by `<ErrorBoundary />` wrapping `<TaskList />`
- User-facing error messages: plain English, no stack traces, displayed inline (not toast/modal in v1)
- Pattern: fail gracefully — on any error, preserve existing visible task list

**Input Validation (dual-layer):**

- **Server (authoritative):** Fastify JSON Schema validates POST body — rejects empty/whitespace text, enforces max length
- **Client (UX):** `addTask` trims and rejects empty text before calling API — prevents unnecessary round trip
- `text.trim()` applied client-side before sending; server also trims

**Test Database Pattern:**

- `DATABASE_URL` env var override points to a dedicated test database (e.g., `donezo_test`)
- `prisma migrate deploy` runs before test suite (CI and local)
- Each test file truncates all tables in `beforeEach` — tests are isolated
- Fastify `app.inject()` tests instantiate a fresh Fastify app per test file with test DB connection
- Never share database state between test files

**Prisma Client Pattern:**

- Single instance in `server/db.ts` — never instantiate `PrismaClient` in a route file
- Route handlers import `prisma` from `server/db.ts`
- Test files import from `server/db.ts` (same singleton, pointed at test DB via env var)

**Tailwind Class Organisation:**

- Layout classes first, then spacing, then typography, then colour, then state variants
- Example: `flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-gray-50`
- No arbitrary values unless no utility exists — prefer design token scale

### Enforcement Guidelines

**All agents MUST:**

- Import the frontend `Task` type from `src/types.ts` — never redefine locally, never import `@prisma/client` in frontend
- Use Prisma client from `server/db.ts` for all database access — never write raw SQL, never instantiate `PrismaClient` in route files
- Use `fetch` with relative URLs (`/api/tasks`) to call API from frontend — never import server code into client, never hardcode host/port
- Co-locate test files with their source — never put tests in a separate `__tests__/` directory
- Keep frontend modules under 150 lines, backend routes under 300 lines
- Return structured `{ error, message }` for all API error responses — never plain text errors
- Await API response before updating store state (pessimistic updates) — never optimistic in v1

**Anti-Patterns:**

- ❌ `localStorage.setItem(...)` — use the API
- ❌ `const [tasks, setTasks] = useState([])` in a component — use Zustand store
- ❌ Raw SQL queries — use Prisma client
- ❌ `import { Task } from '@prisma/client'` in frontend — use `src/types.ts`
- ❌ `import { prisma } from '../db'` in frontend code — use `fetch` to call API
- ❌ `new PrismaClient()` in a route file — import singleton from `server/db.ts`
- ❌ `fetch('http://localhost:3000/api/tasks')` — use relative URL `/api/tasks`
- ❌ Passing `tasks` as props through multiple component layers — select from store directly
- ❌ Returning plain text error from API — use `{ error, message }` structure
- ❌ Optimistic UI updates — await API response first in v1

## Project Structure & Boundaries

### Complete Project Directory Structure

```
donezo/
├── README.md
├── package.json
├── vite.config.ts              # base: '/', dev proxy /api → localhost:3000
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── index.html
├── .gitignore
├── .env                        # DATABASE_URL (local dev)
├── .env.example                # Template with placeholder values
├── Dockerfile                  # multi-stage: node:25-alpine build → node:25-alpine runtime
├── docker-compose.yml          # app + PostgreSQL; app on port 3000
├── .dockerignore
├── .github/
│   └── workflows/
│       └── deploy.yml          # lint → test → build → docker build/push → deploy
├── prisma/
│   ├── schema.prisma           # Task model — source of truth for data shape
│   └── migrations/             # Prisma Migrate output
├── public/
│   └── favicon.svg
├── src/                        # Frontend source
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Root component; calls fetchTasks on mount
│   ├── App.css                 # Tailwind @import + global resets only
│   ├── types.ts                # Frontend Task interface (createdAt: string)
│   ├── components/
│   │   ├── TaskInput.tsx       # FR-01: add task form
│   │   ├── TaskInput.test.tsx
│   │   ├── TaskList.tsx        # FR-05, FR-06, FR-07: list + empty + loading state
│   │   ├── TaskList.test.tsx
│   │   ├── TaskItem.tsx        # FR-02, FR-03, FR-04: display, toggle, delete
│   │   ├── TaskItem.test.tsx
│   │   ├── ErrorBoundary.tsx   # FR-08: render error isolation
│   │   └── ErrorBoundary.test.tsx
│   └── store/
│       ├── useTaskStore.ts     # Zustand store with async API actions
│       └── useTaskStore.test.ts
├── server/                     # Backend source
│   ├── index.ts                # Fastify app setup, plugin registration, static serving
│   ├── db.ts                   # Prisma client singleton
│   └── routes/
│       ├── tasks.ts            # CRUD route handlers (FR-11–14)
│       ├── tasks.test.ts       # API integration tests (Vitest + Fastify inject)
│       └── health.ts           # GET /api/health
└── e2e/                        # Playwright E2E tests (separate from src/)
    ├── playwright.config.ts
    ├── add-task.spec.ts        # Journey 1: Add a Task
    ├── complete-task.spec.ts   # Journey 2: Complete a Task
    ├── delete-task.spec.ts     # Journey 3: Delete a Task
    ├── empty-state.spec.ts     # FR-06: empty state
    ├── error-state.spec.ts     # FR-08: error handling
    └── accessibility.spec.ts   # axe-core WCAG 2.1 AA audit
```

### Architectural Boundaries

**API Boundary:**

- Frontend (`src/`) and backend (`server/`) are separate directory trees
- Frontend communicates with backend exclusively via `fetch('/api/*')` with relative URLs
- Never import server modules in frontend code or vice versa

**Component Boundaries:**

- `<App />` — composes the page; calls `fetchTasks` on mount; no task state as props
- `<TaskInput />` — self-contained form; calls `addTask` from store; no task list awareness
- `<TaskList />` — reads `tasks`, `isLoading`, `error` from store; renders `<TaskItem />` for each, or loading/empty/error state
- `<TaskItem />` — receives a single `Task` via props from `TaskList`; calls `toggleTask`/`deleteTask`
- `<ErrorBoundary />` — class component wrapping `<TaskList />`; catches render errors only

**State Boundary:**

- All task state lives exclusively in `useTaskStore`
- Store is the sole API client — components never call `fetch` directly
- No component holds task state locally

**Data Boundary:**

- `prisma/schema.prisma` — single source of truth for database schema
- `src/types.ts` — single source of truth for frontend `Task` shape
- `server/db.ts` — single Prisma client instance; all database access flows through it
- Database is invisible to frontend; API is the boundary

### Requirements to Structure Mapping

| Requirement | File(s) |
|---|---|
| FR-01 Create task | `TaskInput.tsx`, `useTaskStore.ts` → `addTask`, `server/routes/tasks.ts` → POST |
| FR-02 Display task | `TaskItem.tsx` |
| FR-03 Toggle complete | `TaskItem.tsx`, `useTaskStore.ts` → `toggleTask`, `server/routes/tasks.ts` → PATCH |
| FR-04 Delete task | `TaskItem.tsx`, `useTaskStore.ts` → `deleteTask`, `server/routes/tasks.ts` → DELETE |
| FR-05 Load on open | `useTaskStore.ts` → `fetchTasks`, `server/routes/tasks.ts` → GET |
| FR-06 Empty state | `TaskList.tsx` (conditional render) |
| FR-07 Loading state | `useTaskStore.ts` (`isLoading`), `TaskList.tsx` |
| FR-08 Error state | `ErrorBoundary.tsx`, `useTaskStore.ts` (`error`), `server/routes/tasks.ts` (error handler) |
| FR-09 Persistence | `server/db.ts` + Prisma + PostgreSQL |
| FR-10 Identity-agnostic | `prisma/schema.prisma` (no userId column) |
| FR-11 API CRUD | `server/routes/tasks.ts` (all 4 endpoints) |
| FR-12 Input validation | `server/routes/tasks.ts` (Fastify JSON Schema) |
| FR-13 Error responses | `server/routes/tasks.ts` (error handler returns `{ error, message }`) |
| FR-14 Database persistence | `server/db.ts`, `prisma/schema.prisma`, PostgreSQL |
| NFR-02 Responsive | All components — Tailwind responsive utilities |
| NFR-06 Accessibility | All interactive elements — semantic HTML + Tailwind |
| NFR-07 API performance | `server/routes/tasks.ts` (Prisma queries, Fastify performance) |
| NFR-08 Testability | `server/routes/tasks.test.ts` (Fastify inject) |
| NFR-09 Data integrity | `prisma/schema.prisma` (non-null constraints, timestamps) |

### Integration Points

**Internal Data Flow:**

```
User interaction
  → Component calls store action (fetchTasks / addTask / toggleTask / deleteTask)
  → Store calls API via fetch('/api/tasks')
  → Fastify route handler validates + calls Prisma
  → Prisma executes SQL against PostgreSQL
  → Response flows back: Prisma → Fastify → JSON → Store → React re-render
```

**External Integrations:** None in v1

**CI/CD Flow:**

```
git push main
  → GitHub Actions: npm ci → vitest run → playwright test (with PostgreSQL service)
  → docker build → push image to registry
  → deploy
```

### Development Workflow

**Dev server:** `npm run dev` — runs Vite (:5173) + Fastify (:3000) concurrently; Vite proxy forwards `/api/*`
**Build:** `npm run build` — TypeScript check + Vite build → `dist/`
**Start:** `npm run start` — Fastify serves `dist/` + API (production mode)
**Test:** `npm run test` — Vitest in watch mode (unit + component + API integration)
**Test E2E:** `npm run test:e2e` — Playwright against running app
**Docker:** `docker compose up` — full stack with PostgreSQL

### Asset Organisation

- `public/` — static assets copied verbatim to `dist/` (favicon only in v1)
- No dynamic imports or code splitting needed in v1 (bundle is small by design)

## QA Activities

QA is integrated throughout implementation, not added at the end.

### Test Infrastructure (Story 1 — set up immediately)

- Configure Vitest in `vite.config.ts` with jsdom environment and coverage reporting
- Configure Playwright in `e2e/playwright.config.ts` targeting `localhost:5173` (dev) and `dist/` preview (CI)
- Add test scripts to `package.json`:
  ```json
  "test": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
  ```

### Unit & Integration Tests (alongside each component story)

Write Vitest + RTL tests as each component is built — not after. Each story is not done until its tests pass.

- **Store:** `addTask`, `toggleTask`, `deleteTask` — verify state transitions and localStorage persistence
- **TaskInput:** submit with valid text, reject empty/whitespace, clear after submit
- **TaskList:** renders tasks, renders empty state when `tasks.length === 0`
- **TaskItem:** displays text + timestamp, toggles completion, deletes on click
- **ErrorBoundary:** renders fallback UI when child throws

### E2E Tests (Playwright — cover all user journeys)

Map directly to PRD user journeys:

| Spec file | Covers |
|---|---|
| `add-task.spec.ts` | Journey 1 — type, submit, appears in list, input clears |
| `complete-task.spec.ts` | Journey 2 — toggle completion, persists on refresh |
| `delete-task.spec.ts` | Journey 3 — delete, removed from list, empty state on last |
| `empty-state.spec.ts` | FR-06 — empty state renders correctly |
| `error-state.spec.ts` | FR-08 — error message shown, list unaffected |
| `accessibility.spec.ts` | NFR-06 — axe-core WCAG 2.1 AA audit on full page |

### Quality Gates

**Coverage:** Minimum 70% meaningful coverage (enforced in CI via `vitest run --coverage`); branches and statements, not just lines.

**Performance:** Use Chrome DevTools (Lighthouse CLI in CI) to audit bundle size and interaction responsiveness. Target: interactions ≤300ms, Lighthouse performance score ≥90.

**Accessibility:** `@axe-core/playwright` runs against the rendered app in E2E suite. Zero WCAG 2.1 AA violations permitted to merge.

**Security:** Code review checklist before any PR merges to `main`:
- No user-supplied strings rendered as HTML (`dangerouslySetInnerHTML` banned)
- No `eval()` or dynamic code execution
- No sensitive data (none exists in v1, but establish the habit)
- Dependency audit: `npm audit` must pass with no high/critical vulnerabilities

### Docker / Containerisation

**Dockerfile** — multi-stage build:
```dockerfile
# Stage 1: build
FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/ || exit 1
```

**nginx.conf** — SPA routing (required; without this, direct URL access returns 404):
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

**docker-compose.yml** — local verification and dev/test environments:
```yaml
services:
  app:
    build: .
    ports:
      - "3000:80"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3
```

**Deployment target:** Platform TBD — both are viable:
- **Vercel:** push-to-deploy from git, zero Docker config needed; simplest path
- **AWS App Runner:** deploy from Docker image in ECR; recommended if backend is added in v2
- Decision can be deferred to first deploy story; `Dockerfile` works for either

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are mutually compatible. Vite 8 + React + TypeScript + Tailwind v4 + Zustand (frontend) + Fastify 5.8.4 + Prisma 7.6.0 + PostgreSQL (backend) + Vitest + Playwright form a well-integrated, actively maintained stack with no version conflicts. Vite dev proxy connects frontend to backend cleanly. Multi-stage Docker build (node:25-alpine for both build and runtime) is consistent with Fastify requiring a Node.js runtime. Patterns are internally consistent after the 10-fix elicitation pass — no contradictions remain.

### Requirements Coverage Validation ✅

**Functional Requirements:** All 14 FRs mapped to specific files (see Requirements to Structure Mapping table). No FR is without an architectural owner.

**Non-Functional Requirements:**

- NFR-01 (300ms UI): Pessimistic updates + 200ms API target fits within budget
- NFR-02 (Responsive): Tailwind responsive utilities cover 375px–1440px on all components
- NFR-03 (Reliability): Dual-layer error handling; structured `{ error, message }` responses; network failure fallback defined
- NFR-04 (Maintainability): Frontend modules ≤150 lines, backend ≤300 lines; co-located tests; single responsibility
- NFR-05 (Deployability): Docker Compose with 2 services; `docker compose up` is one step
- NFR-06 (Accessibility): Semantic HTML required by patterns; Tailwind colour utilities provide 4.5:1 contrast; axe-core in E2E
- NFR-07 (API Performance): Fastify + Prisma — both optimized for speed; ≤200ms p95 target defined
- NFR-08 (Testability): API integration tests via Fastify inject against test PostgreSQL; isolated from frontend
- NFR-09 (Data Integrity): Prisma schema enforces non-null constraints, default timestamps; test database pattern prevents orphaned records

### Implementation Readiness Validation ✅

All critical decisions documented with versions. 10 conflict points identified and resolved. Project structure maps every FR to specific files. Anti-patterns explicitly documented to prevent regression. Dual-layer validation, error handling, and data model patterns are fully specified. Store mutation rules are explicit (pessimistic, append/replace/remove).

### Gap Analysis

**Critical Gaps:** None — all decisions required for implementation are present.

**Important (non-blocking):**

- `deploy.yml` GitHub Actions workflow content to be authored in implementation
- Tailwind colour/spacing tokens deferred to implementation (design decisions belong in stories, not architecture)
- ErrorBoundary fallback UI copy deferred to implementation
- Exact max text length for FR-12 validation not specified (recommend defining in implementation, e.g., 500 chars)

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- Project context thoroughly analyzed (14 FRs + 9 NFRs)
- Scale and complexity assessed (Low-Medium)
- Technical constraints identified
- Cross-cutting concerns mapped (7 concerns)

**✅ Architectural Decisions**

- Critical decisions documented with versions (Fastify 5.8.4, Prisma 7.6.0, PostgreSQL, Zustand, Vite 8)
- Technology stack fully specified (frontend + backend + database)
- Integration patterns defined (REST API, Vite proxy, Docker Compose)
- Performance considerations addressed (300ms UI, 200ms API)

**✅ Implementation Patterns**

- Naming conventions established (frontend + backend + database + API)
- Structure patterns defined (separate src/ and server/ trees)
- Communication patterns specified (store → fetch → Fastify → Prisma)
- Process patterns documented (dual-layer validation, error handling, test database lifecycle)

**✅ Project Structure**

- Complete directory structure defined
- Component boundaries established (API, component, state, data)
- Integration points mapped
- Requirements to structure mapping complete (14 FRs + 3 NFRs)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**

- 10 consistency fixes from elicitation ensure agent alignment
- Every FR has an explicit architectural owner across frontend + backend
- Dual-layer patterns (validation, errors) prevent client-server drift
- Pessimistic update strategy eliminates rollback complexity
- Explicit anti-pattern list prevents the most common agent divergences

**Areas for Future Enhancement (v2+):**

- Auth layer: add `userId` column to Task, add auth middleware to Fastify
- React Router: add when multi-view navigation is needed
- Rate limiting: add when public-facing
- Database connection pooling: add when concurrent users increase
- PWA/service worker: add for offline capability if usage patterns warrant it

### Implementation Handoff

**First Implementation Story:**

```bash
npm create vite@latest donezo -- --template react-ts
cd donezo
npm install
npm install tailwindcss @tailwindcss/vite zustand
npm install fastify @fastify/cors @fastify/static prisma @prisma/client
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps
npx prisma init
```

**All AI agents must:**

- Read this document before beginning any implementation story
- Follow Implementation Patterns & Consistency Rules without deviation
- Use the Requirements to Structure Mapping table to locate the correct file for each piece of work
- Keep frontend modules under 150 lines, backend routes under 300 lines; extract before exceeding
- Never import across the frontend/backend boundary — use `fetch` with relative URLs

