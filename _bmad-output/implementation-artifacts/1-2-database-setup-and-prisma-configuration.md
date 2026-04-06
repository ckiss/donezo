# Story 1.2: Database Setup & Prisma Configuration

Status: review

## Story

As a developer,
I want PostgreSQL configured with Prisma ORM and the Task schema migrated,
so that the database is ready for API development.

## Acceptance Criteria

1. `npx prisma migrate dev` creates the `Task` table in PostgreSQL with columns: `id` (UUID, primary key), `text` (non-null string), `completed` (boolean, default false), `createdAt` (timestamp, default now)
2. `prisma/schema.prisma` defines the Task model matching the architecture spec
3. `.env` contains `DATABASE_URL` pointing to the local PostgreSQL instance
4. `.env.example` exists with a placeholder `DATABASE_URL`
5. `server/db.ts` connects to PostgreSQL via the Prisma client singleton
6. A simple query (`prisma.task.findMany()`) executes successfully

## Tasks / Subtasks

- [x] Task 1: Define Task model in Prisma schema (AC: 1, 2)
  - [x] Updated `prisma/schema.prisma` with Task model matching architecture spec
  - [x] Ran `npx prisma generate` — client regenerated with Task model

- [x] Task 2: Configure environment files (AC: 3, 4)
  - [x] `.env` updated with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/donezo?schema=public`
  - [x] Created `.env.example` with placeholder
  - [x] Added `.env` to `.gitignore`, updated generated prisma path

- [x] Task 3: Run initial migration (AC: 1)
  - [x] Started PostgreSQL via Docker: `postgres:17-alpine` on port 5432
  - [x] Ran `npx prisma migrate dev --name init` — migration `20260406100319_init` applied
  - [x] Migration files created in `prisma/migrations/`

- [x] Task 4: Verify database connectivity (AC: 5, 6)
  - [x] Ran `prisma.task.findMany()` via tsx script — returned empty array
  - [x] Connection verified OK

- [x] Task 5: Verify build still passes
  - [x] `npm run build` — zero type errors
  - [x] `npm run test:run` — 33 tests pass

## Dev Notes

### Architecture Context

**From Story 1.1:** Prisma is already initialized with `prisma/schema.prisma`, `prisma.config.ts`, and `generated/prisma/`. The `server/db.ts` singleton uses the Prisma 7 adapter pattern (`PrismaPg` + `PrismaClient({ adapter })`).

**This story adds:** The Task model to the schema and runs the first migration.

### Prisma Schema (from architecture)

```prisma
model Task {
  id        String   @id @default(uuid())
  text      String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Critical Rules

- Prisma schema is the single source of truth for database structure
- No `userId` column in v1 — identity-agnostic by design (FR-10)
- After schema changes, always run `npx prisma generate` to regenerate the client
- `prisma.config.ts` handles the datasource URL from env vars

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- PostgreSQL started via Docker: `docker run -d --name donezo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=donezo -p 5432:5432 postgres:17-alpine`

### Completion Notes List

- Task model added to Prisma schema, migration applied, connectivity verified
- Build and all 33 tests pass

### File List

- **Modified:** `prisma/schema.prisma` — added Task model
- **New:** `prisma/migrations/20260406100319_init/migration.sql` — initial migration
- **New:** `.env.example` — placeholder DATABASE_URL
- **Modified:** `.env` — updated to local PostgreSQL URL
- **Modified:** `.gitignore` — added `.env`, updated generated prisma path
- **Regenerated:** `generated/prisma/` — now includes Task model types

### Change Log

- 2026-04-06: Story 1.2 implemented — Task model defined, initial migration applied, database connectivity verified
