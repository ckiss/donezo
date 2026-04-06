import { test, expect } from '@playwright/test'

test.describe('Error state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('ErrorBoundary catches render errors and shows fallback', async ({ page }) => {
    // Inject corrupt localStorage data that will cause a render error (tasks.map on a string)
    await page.evaluate(() => {
      localStorage.setItem('donezo_tasks', JSON.stringify({
        state: { tasks: 'not-an-array' },
        version: 0,
      }))
    })
    await page.reload()

    // ErrorBoundary should catch the render error and show fallback
    await expect(page.getByText('Something went wrong')).toBeVisible()
    // TaskInput should remain visible and functional outside the boundary
    await expect(page.getByPlaceholder('Add a task...')).toBeVisible()
  })

  test('TaskInput remains functional while error boundary is active', async ({ page }) => {
    // Inject corrupt data to trigger error boundary
    await page.evaluate(() => {
      localStorage.setItem('donezo_tasks', JSON.stringify({
        state: { tasks: 'not-an-array' },
        version: 0,
      }))
    })
    await page.reload()

    // Verify error boundary is showing
    await expect(page.getByText('Something went wrong')).toBeVisible()

    // TaskInput should still work — type and submit a task
    await page.getByPlaceholder('Add a task...').fill('Test task')
    await page.getByPlaceholder('Add a task...').press('Enter')
    // Input should clear after submit (store addTask still works)
    await expect(page.getByPlaceholder('Add a task...')).toHaveValue('')
  })
})
