import { test, expect } from '@playwright/test'
import { clearTasks } from './helpers'

test.describe('Error state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearTasks(page)
    await page.reload()
  })

  test('shows error message when API is unreachable and preserves input', async ({ page }) => {
    // Block all API requests to simulate network failure
    await page.route('**/api/tasks', (route) => route.abort())

    // Try to add a task — should fail with error
    await page.getByPlaceholder('Add a task...').fill('Test task')
    await page.getByPlaceholder('Add a task...').press('Enter')

    // Error message should appear
    await expect(page.getByText('Unable to reach server')).toBeVisible()

    // Input should still be functional
    await expect(page.getByPlaceholder('Add a task...')).toBeVisible()
  })

  test('error clears on next successful action', async ({ page }) => {
    // Block API to trigger error
    await page.route('**/api/tasks', (route) => route.abort())

    await page.getByPlaceholder('Add a task...').fill('Test task')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Unable to reach server')).toBeVisible()

    // Unblock API
    await page.unroute('**/api/tasks')

    // Successful action should clear error
    await page.getByPlaceholder('Add a task...').fill('Another task')
    await page.getByPlaceholder('Add a task...').press('Enter')

    await expect(page.getByText('Another task')).toBeVisible()
    await expect(page.getByText('Unable to reach server')).not.toBeVisible()
  })
})
