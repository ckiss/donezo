import type { Page } from '@playwright/test'

/**
 * Delete all tasks via the API to ensure test isolation.
 * Replaces the old localStorage.clear() pattern.
 *
 * Calls Fastify directly on :3000 (not through Vite proxy)
 * because Playwright's request API is out-of-band.
 */
export async function clearTasks(page: Page) {
  const port = process.env.PORT ?? '3000'
  const base = `http://localhost:${port}`
  const res = await page.request.get(`${base}/api/tasks`)
  if (!res.ok()) {
    throw new Error(
      `clearTasks: GET /api/tasks failed (${res.status()}). Is the API server running on ${base}?`,
    )
  }
  const tasks = (await res.json()) as { id: string }[]
  for (const task of tasks) {
    await page.request.delete(`${base}/api/tasks/${task.id}`)
  }
}
