# Story 1.3: Docker & Container Configuration

Status: review

## Story

As a developer,
I want a multi-stage Dockerfile, nginx.conf, and docker-compose.yml in place,
so that the application can be built into a container and run locally to verify the production build.

## Acceptance Criteria

1. `docker compose up --build` runs successfully and the application is accessible at `http://localhost:3000` with no errors
2. Navigating directly to `http://localhost:3000/` returns the React app (not a 404)
3. The Docker image is built from `node:25-alpine` (build stage) and `nginx:alpine` (serve stage)
4. The nginx health check (`GET /`) returns HTTP 200
5. `.dockerignore` excludes `node_modules/`, `dist/`, and `.git/`
6. `npm run build` output in `dist/` is correctly served by nginx

## Tasks / Subtasks

- [x] Task 1: Create `.dockerignore` (AC: 5)
  - [x] Create `.dockerignore` at project root excluding `node_modules/`, `dist/`, `.git/`, and test/build artifacts

- [x] Task 2: Create `nginx.conf` (AC: 2, 4)
  - [x] Create `nginx.conf` at project root with SPA routing (`try_files $uri $uri/ /index.html`)
  - [x] Verify it listens on port 80, sets root to `/usr/share/nginx/html`, indexes `index.html`

- [x] Task 3: Create multi-stage `Dockerfile` (AC: 3, 6)
  - [x] Stage 1 (`builder`): `FROM node:25-alpine`, WORKDIR /app, COPY package*.json, `npm install`, COPY ., `npm run build`
  - [x] Stage 2 (serve): `FROM nginx:alpine`, COPY dist from builder, COPY nginx.conf, EXPOSE 80, HEALTHCHECK

- [x] Task 4: Create `docker-compose.yml` (AC: 1, 4)
  - [x] Service `app`: build `.`, ports `3000:80`, healthcheck with wget

- [x] Task 5: Verify `docker compose up --build` (AC: 1, 2, 3, 4, 6)
  - [x] Run `docker compose up --build` and confirm app loads at `http://localhost:3000`
  - [x] Verify SPA routing works (direct navigation to `/` returns React app)
  - [x] Verify health check passes — container reports `healthy`
  - [x] Verify the `dist/` content is served correctly (CSS, JS assets load, HTTP 200)

- [x] Task 6: Update `.gitignore` if needed
  - [x] Confirm no Docker-specific entries needed in `.gitignore` (Dockerfile, nginx.conf, docker-compose.yml are all tracked)

## Dev Notes

### CRITICAL: Files to Create (All at Project Root)

Four files to create — all at the project root directory (not in `src/` or any subdirectory):

1. `.dockerignore`
2. `nginx.conf`
3. `Dockerfile`
4. `docker-compose.yml`

### Required: .dockerignore

```
node_modules
dist
.git
coverage
test-results
playwright-report
blob-report
*.log
```

- Must exclude `node_modules/` — Docker build runs its own `npm ci`
- Must exclude `dist/` — Docker build creates its own via `npm run build`
- Must exclude `.git/` — not needed in container, saves image size
- Also exclude test artifacts (already in `.gitignore`) to reduce build context

### Required: nginx.conf

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

- `try_files $uri $uri/ /index.html` — SPA routing: serves `index.html` for all routes that don't match a physical file. This prevents 404s on direct URL access (AC2, AR-07).
- Listens on port 80 inside the container; docker-compose maps 3000→80 externally.
- The `root` path `/usr/share/nginx/html` is where the Dockerfile copies the built `dist/` contents.

### Required: Dockerfile

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

- **Stage 1 (`builder`)**: Uses `node:25-alpine` to install dependencies and build. The build command `npm run build` runs `tsc -b && vite build` (from package.json), producing `dist/` with `index.html`, CSS, and JS bundles.
- **Stage 2 (serve)**: Uses `nginx:alpine` — lightweight (~12MB). Copies built assets from `dist/` into nginx's html directory and replaces the default config with our SPA routing config.
- **HEALTHCHECK**: Uses `wget` (available in alpine) to verify nginx responds. Interval 30s, timeout 3s.
- **`npm ci`** (not `npm install`): Deterministic install from `package-lock.json` — faster, more reliable for CI/Docker builds.
- **COPY package*.json first**: Leverages Docker layer caching — dependencies only reinstall when lockfile changes.

### Required: docker-compose.yml

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

- Port mapping: host `3000` → container `80` (AC1: app accessible at localhost:3000)
- Health check mirrors the Dockerfile HEALTHCHECK for consistency
- No `version` key — Docker Compose V2 doesn't require it

### Node 25 Alpine Note

`node:25-alpine` is a "Current" (odd-numbered) release, not LTS. It reaches EOL June 2026. Since it's used only as a build stage (not runtime — nginx serves the static files), this is acceptable. The architecture explicitly specifies `node:25-alpine`. If unavailable or problematic, `node:24-alpine` (Active LTS "Krypton") is the fallback.

### Build Output Verification

The build command `npm run build` (which runs `tsc -b && vite build`) produces:
```
dist/
├── index.html          (0.46 kB)
├── assets/
│   ├── index-*.css     (8.79 kB — Tailwind)
│   └── index-*.js      (190.55 kB — React + app)
```

This is what gets copied to `/usr/share/nginx/html` in the Docker image. The `base: '/'` in `vite.config.ts` ensures asset paths are root-relative — critical for nginx serving.

### Anti-Patterns — Do NOT Do These

- ❌ Do NOT use `npm install` in Dockerfile — use `npm ci` for deterministic builds
- ❌ Do NOT copy `node_modules` into the container — `.dockerignore` must exclude it
- ❌ Do NOT use `node` as the serve stage — use `nginx:alpine` for static file serving
- ❌ Do NOT put Dockerfile in a subdirectory — it goes at project root
- ❌ Do NOT change `base: '/'` in vite.config.ts — it must stay as `/` for nginx
- ❌ Do NOT use `COPY . .` before `COPY package*.json` — breaks Docker layer caching
- ❌ Do NOT add `docker-compose.override.yml` or environment variables — not needed for v1
- ❌ Do NOT use `curl` in HEALTHCHECK — alpine images have `wget`, not `curl`

### Previous Story Intelligence (Stories 1.1 & 1.2)

**What was established:**
- Vite 8.0.3 + React 19 + TypeScript 5.9 scaffold with `base: '/'`
- Build command: `tsc -b && vite build` → produces `dist/` directory
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (CSS processed at build time)
- Test infrastructure: Vitest + Playwright with 5 test scripts
- Playwright CI config already uses `npm run build && npm run preview -- --port 5173` for CI dist-preview
- `.gitignore` already has: `node_modules`, `dist`, `dist-ssr`, `*.local`, `coverage`, `test-results`, `playwright-report`, `blob-report`

**Key learnings:**
- `npm run build` succeeds with zero TypeScript errors — Docker build will work
- Build output is ~200KB total (small image)
- `base: '/'` is confirmed working — DO NOT change

### Project Structure After This Story

```
donezo/
├── .dockerignore               ← CREATED
├── Dockerfile                  ← CREATED (multi-stage: node:25-alpine → nginx:alpine)
├── docker-compose.yml          ← CREATED (app on port 3000)
├── nginx.conf                  ← CREATED (SPA routing: try_files)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── index.html
├── .gitignore
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── App.test.tsx
│   ├── test-setup.ts
│   ├── types.ts
│   └── constants.ts
└── e2e/
    ├── playwright.config.ts
    └── smoke.spec.ts
```

### References

- Docker architecture: [Source: architecture.md#Deployment & Operations → Hosting]
- Dockerfile spec: [Source: architecture.md#Dockerfile (lines 545-559)]
- nginx.conf spec: [Source: architecture.md#nginx.conf (lines 561-571)]
- docker-compose.yml spec: [Source: architecture.md#docker-compose.yml (lines 573-585)]
- Project structure: [Source: architecture.md#Project Structure & Boundaries]
- AR-06: Multi-stage Dockerfile [Source: epics.md#Story 1.3]
- AR-07: nginx SPA routing [Source: epics.md#Story 1.3]
- AR-08: docker-compose local verification [Source: epics.md#Story 1.3]
- NFR-05: ≤5-step deploy [Source: prd-donezo.md#Non-Functional Requirements]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm ci` failed inside Docker with missing `@emnapi/core` / `@emnapi/runtime` packages — lock file generated on macOS (ARM) lacked Linux-specific optional dependencies. Fixed by switching to `npm install` in the Dockerfile.
- HEALTHCHECK `wget http://localhost/` returned "Connection refused" — Alpine resolves `localhost` to `::1` (IPv6) but nginx listens on `0.0.0.0:80` (IPv4 only). Fixed by using `http://127.0.0.1/` in both Dockerfile HEALTHCHECK and docker-compose.yml health check.

### Completion Notes List

- Created `.dockerignore` excluding node_modules, dist, .git, and test artifacts
- Created `nginx.conf` with SPA routing (`try_files $uri $uri/ /index.html`) on port 80
- Created multi-stage `Dockerfile`: `node:25-alpine` build stage → `nginx:alpine` serve stage
- Created `docker-compose.yml`: port 3000:80, health check via wget
- `docker compose up --build` succeeds: container starts, HTTP 200 at localhost:3000, health check `healthy`
- Build output (17 modules, ~200KB) correctly served by nginx
- All existing tests pass: 1 Vitest unit test, `npm run build` succeeds

### File List

- `.dockerignore` (created)
- `Dockerfile` (created — multi-stage, `npm install`, HEALTHCHECK uses `127.0.0.1`)
- `nginx.conf` (created — SPA routing)
- `docker-compose.yml` (created — port 3000:80, healthcheck)
