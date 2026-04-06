import { test, expect } from '@playwright/test'

test.describe('Empty state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('shows empty state when no tasks exist', async ({ page }) => {
    await expect(page.getByText('No tasks yet')).toBeVisible()
    await expect(page.getByText('Add your first task above')).toBeVisible()
  })

  test('hides empty state when a task is added', async ({ page }) => {
    await expect(page.getByText('No tasks yet')).toBeVisible()

    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')

    await expect(page.getByText('No tasks yet')).not.toBeVisible()
    await expect(page.getByText('Buy milk')).toBeVisible()
  })

  test('shows empty state again when last task is deleted', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()
    await expect(page.getByText('No tasks yet')).not.toBeVisible()

    await page.getByRole('button', { name: /delete "Buy milk"/i }).click()

    await expect(page.getByText('No tasks yet')).toBeVisible()
  })
})
