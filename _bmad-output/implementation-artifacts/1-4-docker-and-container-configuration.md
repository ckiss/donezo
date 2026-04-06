# Story 1.4: Docker & Container Configuration

Status: review

## Story

As a developer,
I want a Dockerfile and docker-compose.yml with PostgreSQL,
so that the full stack can be built and run locally to verify the production setup.

## Tasks / Subtasks

- [x] Task 1: Rewrite Dockerfile for Fastify (was nginx)
  - [x] Multi-stage: node:25-alpine build → node:25-alpine runtime
  - [x] Prisma generate in build stage, migrate deploy in CMD
  - [x] tsx installed in production stage for running TypeScript server
- [x] Task 2: Rewrite docker-compose.yml with PostgreSQL
  - [x] PostgreSQL 17-alpine service with health check and named volume
  - [x] App service depends on healthy db, DATABASE_URL pointing to db container
- [x] Task 3: Update .dockerignore
- [x] Task 4: Remove nginx.conf (no longer needed)
- [x] Task 5: Verify docker compose up --build
  - [x] GET /api/health returns { status: "ok" }
  - [x] Frontend served at http://localhost:3000/

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- **Modified:** Dockerfile — rewritten from nginx to Fastify runtime
- **Modified:** docker-compose.yml — added PostgreSQL, updated app container
- **Modified:** .dockerignore — added .env, e2e, _bmad-output
- **Deleted:** nginx.conf — replaced by Fastify static serving

### Change Log
- 2026-04-06: Story 1.4 — Docker rewritten for Fastify + PostgreSQL, verified with docker compose
