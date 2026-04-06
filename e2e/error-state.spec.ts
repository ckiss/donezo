import type { Route } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { clearTasks } from './helpers'

const NETWORK_ERROR = 'Unable to reach server. Please try again.'

/** Extract pathname from a request URL for matching. */
function pathFromUrl(href: string): string {
  try {
    return new URL(href).pathname.replace(/\/$/, '') || '/'
  } catch {
    return ''
  }
}

/** Abort only /api/tasks* requests; let everything else through. */
async function abortTaskApi(route: Route) {
  const path = pathFromUrl(route.request().url())
  if (path === '/api/tasks' || path.startsWith('/api/tasks/')) {
    await route.abort('failed')
  } else {
    await route.continue()
  }
}

test.describe('API error state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearTasks(page)
    await page.reload()
    await expect(page.getByText('No tasks yet')).toBeVisible()
  })

  test('shows network error when task API cannot be reached', async ({ page }) => {
    await page.route('**/*', abortTaskApi)

    await page.getByPlaceholder('Add a task...').fill('Water plants')
    await page.getByPlaceholder('Add a task...').press('Enter')

    await expect(
      page.getByRole('alert').filter({ hasText: NETWORK_ERROR }),
    ).toBeVisible()

    // Input remains functional
    await expect(page.getByPlaceholder('Add a task...')).toBeVisible()
    // No task was added (API failed)
    await expect(page.getByText('No tasks yet')).toBeVisible()
  })

  test('error clears after a successful action when API recovers', async ({ page }) => {
    await page.route('**/*', abortTaskApi)

    await page.getByPlaceholder('Add a task...').fill('First try')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(
      page.getByRole('alert').filter({ hasText: NETWORK_ERROR }),
    ).toBeVisible()

    // Restore API
    await page.unroute('**/*', abortTaskApi)

    await page.getByPlaceholder('Add a task...').fill('Recovered task')
    await page.getByPlaceholder('Add a task...').press('Enter')

    await expect(page.getByText('Recovered task')).toBeVisible()
    await expect(
      page.getByRole('alert').filter({ hasText: NETWORK_ERROR }),
    ).not.toBeVisible()
  })
})
