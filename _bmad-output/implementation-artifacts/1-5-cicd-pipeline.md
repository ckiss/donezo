# Story 1.5: CI/CD Pipeline

Status: review

## Story

As a developer,
I want a GitHub Actions workflow that lints, tests, builds, and deploys on every push to main,
so that every merge is automatically validated and deployed.

## Tasks / Subtasks

- [x] Task 1: Add PostgreSQL service container to test job
  - [x] postgres:17-alpine with health check
  - [x] DATABASE_URL env var for Prisma
  - [x] prisma generate + migrate deploy steps
- [x] Task 2: Add PostgreSQL service to E2E job
  - [x] Same pattern as test job
  - [x] prisma generate + migrate deploy before E2E tests
- [x] Task 3: Update Node version to 25 (matches Dockerfile)
- [x] Task 4: Verify build and tests pass locally

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List
- **Modified:** .github/workflows/deploy.yml — added PostgreSQL services, Prisma steps, Node 25

### Change Log
- 2026-04-06: Story 1.5 — CI/CD updated with PostgreSQL service containers for test and E2E jobs
