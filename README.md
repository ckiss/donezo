# Donezo

A minimal single-user todo app — React + TypeScript + Vite, deployed as a Docker container.

## Tech Stack

- **Frontend:** React 19 + TypeScript 5.9 + Vite 8
- **Styling:** Tailwind CSS v4
- **State:** Zustand 5 + localStorage persistence
- **Testing:** Vitest + React Testing Library (unit) · Playwright (E2E)
- **Container:** nginx:alpine serving a multi-stage Docker build

## Local Development

```bash
git clone <repo-url> donezo
cd donezo
npm install
npm run dev        # http://localhost:5173
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | TypeScript check + production build → `dist/` |
| `npm run preview` | Serve built `dist/` locally |
| `npm run lint` | ESLint |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest with V8 coverage (≥70% required) |
| `npm run test:e2e` | Playwright E2E (3 browsers) |
| `npm run test:e2e:ui` | Playwright UI mode |

## Run with Docker

```bash
docker compose up --build   # http://localhost:3000
docker compose down
```

## Deployment

The CI/CD pipeline (`.github/workflows/deploy.yml`) automatically:
1. Runs linting, unit tests (≥70% coverage), and build on every push to `main`
2. Runs Playwright E2E tests across Chromium, Firefox, and WebKit
3. Builds and pushes a Docker image to GitHub Container Registry (GHCR)

### Manual deployment setup (≤5 steps)

1. Fork or push this repo to GitHub
2. Enable GitHub Actions (Settings → Actions → Allow all actions)
3. Enable GitHub Packages write access (Settings → Actions → Workflow permissions → Read and write)
4. Push to `main` — CI runs automatically and pushes `ghcr.io/<owner>/donezo:latest`
5. Pull and run the image: `docker run -p 3000:80 ghcr.io/<owner>/donezo:latest`

> The Docker image serves the production Vite build via nginx with SPA routing enabled.
> For persistent hosting, deploy to any platform that runs Docker containers (Fly.io, Railway, AWS App Runner, etc.).
