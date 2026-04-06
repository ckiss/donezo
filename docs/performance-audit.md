# Performance Audit Report — Donezo

**Date:** 2026-04-06 (re-audit)
**Tools:** Chrome DevTools MCP (Performance Trace, Lighthouse, Network Inspector, Heap Snapshot)
**Environment:** Production Docker build — Fastify + PostgreSQL (`localhost:3000`)

---

## Lighthouse Scores

| Category | Desktop | Mobile |
|----------|---------|--------|
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

**0 failed audits.** All 45 audits pass on both desktop and mobile.

## Core Web Vitals (Lab)

| Metric | Value | Rating |
|--------|-------|--------|
| LCP (Largest Contentful Paint) | 61 ms | Excellent (< 2500 ms) |
| CLS (Cumulative Layout Shift) | 0.00 | Excellent (< 0.1) |
| TTFB (Time to First Byte) | 6 ms | Excellent |

**LCP element:** `<h1 class="text-blue-700 text-2xl font-bold mb-4">` — text-only, no network resource needed.
**LCP breakdown:** TTFB 6 ms (10.3%) + Render delay 55 ms (89.7%).

## Network Profile

| Resource | Status | Size | Cache-Control | Charset |
|----------|--------|------|---------------|---------|
| `/` (HTML) | 200 | 574 B | `public, max-age=0` | `text/html; charset=utf-8` |
| `/assets/index-BvgOnlLz.js` | 200 | 197 KB | `public, max-age=0` | `application/javascript; charset=utf-8` |
| `/assets/index-CQBjDEQU.css` | 200 | ~16 KB | `public, max-age=0` | `text/css; charset=utf-8` |
| `/api/tasks` | 200 | dynamic | _(none)_ | `application/json; charset=utf-8` |

**Total requests on page load:** 4 (HTML + JS + CSS + API)

### Critical Request Chain

```
localhost:3000/                         (6 ms TTFB)
├── /assets/index-BvgOnlLz.js          (15 ms)
│   └── /api/tasks                      (39 ms)  ← waterfall, waits for JS
└── /assets/index-CQBjDEQU.css         (12 ms)
```

Max critical path latency: **39 ms**

## Memory (Client-Side)

| Metric | Value |
|--------|-------|
| Heap snapshot size | 5.8 MB |
| Node count | 77,673 |
| Edge count | 324,767 |

Healthy for a React SPA. No detached DOM nodes or memory leaks observed. Heap is 45% smaller than the previous nginx-served build (10.3 MB → 5.8 MB), likely due to fewer dev-mode artifacts.

---

## New Issues Found

### N1 — Static Assets Missing Long-Lived Cache Headers (Fastify)

**Severity:** High
**Source:** Network inspection — `Cache-Control: public, max-age=0` on `/assets/*`

The app now uses Fastify + `@fastify/static` instead of nginx. The `@fastify/static` default is `max-age=0`, so browsers revalidate every request even though Vite produces content-hashed filenames that are safe to cache indefinitely.

**Fix in `server/index.ts`:** Set `maxAge` for the static plugin:

```typescript
await app.register(fastifyStatic.default, {
  root: resolve(import.meta.dirname, '../dist'),
  prefix: '/',
  maxAge: '1y',
  immutable: true,
})
```

Or for more granular control, only cache `/assets/` long-term and keep the HTML at `max-age=0` via a `setHeaders` callback:

```typescript
await app.register(fastifyStatic.default, {
  root: resolve(import.meta.dirname, '../dist'),
  prefix: '/',
  setHeaders(res, filepath) {
    if (filepath.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    } else {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
    }
  },
})
```

---

### N2 — No Compression (Fastify)

**Severity:** High
**Source:** Network inspection — no `Content-Encoding` header on any response

The JS bundle is **197 KB uncompressed**. With gzip it would be ~63 KB (68% smaller). Fastify does not compress by default.

**Fix:** Register `@fastify/compress` in `server/app.ts`:

```typescript
import compress from '@fastify/compress'

export async function buildApp() {
  const app = Fastify({ logger: false })
  await app.register(compress)
  // ...
}
```

Then install: `npm install @fastify/compress`

---

### N3 — API Responses Lack Cache-Control Headers

**Severity:** Low
**Source:** Network inspection — `/api/tasks` has no `Cache-Control` header

Dynamic API responses should explicitly declare `Cache-Control: no-store` to prevent intermediate caches (CDN, proxies) from serving stale data.

**Fix in `server/routes/tasks.ts`:** Add a reply hook or set the header on each response:

```typescript
reply.header('Cache-Control', 'no-store')
```

---

### N4 — Render-Blocking CSS (Informational)

**Severity:** Info
**Source:** Performance trace — `index-CQBjDEQU.css` blocks initial render for 4 ms

Negligible impact. Estimated savings: 0 ms. No action needed.

---

### N5 — API Fetch Waterfall Behind JS Bundle

**Severity:** Info
**Source:** Network dependency tree insight

The `/api/tasks` request can't start until the JS bundle loads and evaluates (waterfall). This is inherent to SPA architecture and adds ~24 ms to the critical path. At 39 ms total, this is well within acceptable limits.

**Potential future optimization:** Add `<link rel="preload" href="/api/tasks" as="fetch" crossorigin>` to `index.html` to start the API call in parallel with JS download. Only worth pursuing if API latency becomes a bottleneck.

---

## Comparison With Previous Audit (2026-04-03)

| Metric | v1 (nginx) | v2 (Fastify) | Change |
|--------|------------|--------------|--------|
| LCP | 63 ms | 61 ms | -3% |
| CLS | 0.00 | 0.00 | — |
| TTFB | 1 ms | 6 ms | +5 ms |
| Lighthouse A11y | 100 | 100 | — |
| Lighthouse BP | 100 | 100 | — |
| Lighthouse SEO | 100 | 100 | — |
| Requests | 4 | 4 | — |
| Heap | 10.3 MB | 5.8 MB | -44% |
| Compression | gzip (nginx) | **none** | Regression |
| Asset Cache | 1 year immutable | **max-age=0** | Regression |

**Architecture change:** nginx → Fastify means the nginx.conf cache/gzip/charset fixes from v1 no longer apply. The equivalent Fastify configuration (N1, N2) needs to be applied.

## Priority Action Items

1. **N2 — Enable compression** — Install `@fastify/compress` (biggest bandwidth win)
2. **N1 — Cache static assets** — Configure `@fastify/static` with `maxAge` / `immutable`
3. **N3 — API cache headers** — Add `no-store` to dynamic responses (good hygiene)
