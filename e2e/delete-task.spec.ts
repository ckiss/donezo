import { test, expect } from '@playwright/test'
import { clearTasks } from './helpers'

test.describe('Delete task', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearTasks(page)
    await page.reload()
  })

  test('removes task from the list within 300ms', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()

    await page.getByRole('button', { name: /delete "Buy milk"/i }).click()

    await expect(page.getByText('Buy milk')).not.toBeVisible({ timeout: 300 })
  })

  test('deleted task does not reappear after reload', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()

    await page.getByRole('button', { name: /delete "Buy milk"/i }).click()
    await expect(page.getByText('Buy milk')).not.toBeVisible()

    await page.reload()

    await expect(page.getByText('Buy milk')).not.toBeVisible()
  })

  test('deleting one task does not affect others', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await page.getByPlaceholder('Add a task...').fill('Walk dog')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()
    await expect(page.getByText('Walk dog')).toBeVisible()

    await page.getByRole('button', { name: /delete "Buy milk"/i }).click()

    await expect(page.getByText('Buy milk')).not.toBeVisible({ timeout: 300 })
    await expect(page.getByText('Walk dog')).toBeVisible()
  })
})
