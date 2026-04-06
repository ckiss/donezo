# Performance Audit Report — Donezo

**Date:** 2026-04-03
**Tools:** Chrome DevTools MCP (Performance Trace, Lighthouse, Network Inspector, Heap Snapshot)
**Environment:** Production build served via nginx:alpine (Docker), tested on desktop Chrome

---

## Scores Summary

| Category | Desktop | Mobile |
|----------|---------|--------|
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 82 | 82 |

## Core Web Vitals (Lab)

| Metric | Value | Rating |
|--------|-------|--------|
| LCP (Largest Contentful Paint) | 164 ms | Excellent (< 2500 ms) |
| CLS (Cumulative Layout Shift) | 0.00 | Excellent (< 0.1) |
| TTFB (Time to First Byte) | 1 ms | Excellent |

**LCP element:** `<h1>` heading text — no network resource needed, so LCP is dominated by render delay (99.3%) rather than resource loading. This is expected for a text-only LCP element.

## Memory

| Metric | Value |
|--------|-------|
| Heap snapshot size | 10.3 MB |
| Node count | 121,606 |
| Edge count | 563,597 |

Heap is healthy for a React SPA. No detached DOM nodes or signs of memory leaks observed.

---

## Issues Found

### P1 — No Cache Headers on Static Assets (nginx)

**Source:** Performance trace Cache insight
**Impact:** Repeat visits re-download all JS/CSS instead of serving from browser cache.

Vite produces content-hashed filenames (e.g., `index-BrXLEaIJ.js`, `index-B2j9I-d9.css`) that are safe to cache indefinitely. However, the nginx config sets no caching headers at all — both assets show **TTL: 0 seconds**.

**Fix:** Add cache-control headers in `nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    add_header Cache-Control "no-cache";
    try_files $uri $uri/ /index.html;
  }
}
```

---

### P2 — Missing `charset` in HTTP Content-Type Header (nginx)

**Source:** Performance trace CharacterSet insight
**Impact:** Browser may re-parse the document once it discovers the encoding, delaying first contentful paint.

The HTML includes `<meta charset="UTF-8">` but nginx does not send `charset=utf-8` in the `Content-Type` response header.

**Fix:** Add charset directive in `nginx.conf`:

```nginx
charset utf-8;
```

---

### P3 — No gzip/Brotli Compression (nginx)

**Source:** Network request inspection — no `Content-Encoding` header observed
**Impact:** Uncompressed JS/CSS transfers are larger than necessary, slowing load on slower connections.

**Fix:** Enable gzip in `nginx.conf`:

```nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json image/svg+xml;
gzip_min_length 256;
```

---

### P4 — Missing Meta Description (SEO)

**Source:** Lighthouse SEO audit — `meta-description` failed
**Impact:** Search engines won't have a summary to display in results.

**Fix in `index.html`:**

```html
<meta name="description" content="A minimal, accessible single-user todo app built with React and TypeScript." />
```

---

### P5 — Missing `robots.txt` (SEO)

**Source:** Lighthouse SEO audit — `robots-txt` failed
**Impact:** Crawlers can't determine indexing rules for the site.

**Fix:** Create `public/robots.txt`:

```
User-agent: *
Allow: /
```

---

### P6 — Page Title Is Still Scaffolding Name

**Source:** Manual review of `index.html`
**Impact:** Tab title shows "donezo-scaffold" instead of the product name.

**Fix in `index.html`:** Change `<title>donezo-scaffold</title>` to `<title>Donezo</title>`.

---

### P7 — TaskItem Not Memoized (React)

**Source:** Code review of `src/components/TaskItem.tsx`
**Impact:** When any task changes (add/toggle/delete), every `TaskItem` re-renders. With many tasks, this creates unnecessary work.

Additionally, `new Date(task.createdAt).toLocaleString()` runs on every render without memoization.

**Fix:** Wrap `TaskItem` in `React.memo` and memoize the date string:

```tsx
import { memo, useMemo } from 'react'

export const TaskItem = memo(function TaskItem({ task }: TaskItemProps) {
  const toggleTask = useTaskStore((s) => s.toggleTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const formattedDate = useMemo(
    () => new Date(task.createdAt).toLocaleString(),
    [task.createdAt]
  )
  // ...
})
```

---

### P8 — Render-Blocking CSS (Minor)

**Source:** Performance trace RenderBlocking insight
**Impact:** `index-B2j9I-d9.css` blocks initial render. Total blocking time: 3 ms — negligible for this app size.

**Recommendation:** No action needed now. If the CSS bundle grows, consider inlining critical CSS or using `media` attribute to defer non-critical styles.

---

## Summary

The app performs well overall — excellent Core Web Vitals, perfect accessibility, and a clean memory profile. The highest-impact fixes are:

1. **Add cache headers** (P1) — biggest real-world improvement for returning users
2. **Add charset header** (P2) — prevents potential re-parsing
3. **Enable compression** (P3) — smaller transfers
4. **Fix SEO gaps** (P4, P5, P6) — brings Lighthouse SEO to 100

The React memoization fix (P7) is preventive — it won't matter with a handful of tasks, but will help as the list grows.
