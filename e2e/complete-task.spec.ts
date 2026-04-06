import { test, expect } from '@playwright/test'
import { clearTasks } from './helpers'

test.describe('Complete task', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearTasks(page)
    await page.reload()
  })

  test('marks task as completed with visual indicator within 300ms', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()

    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).click()

    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()
    await expect(page.getByText('Buy milk')).toHaveClass(/line-through/)
  })

  test('completed state persists after page reload', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()

    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).click()
    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()

    await page.reload()

    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()
    await expect(page.getByText('Buy milk')).toHaveClass(/line-through/)
  })

  test('unchecking a completed task reverts to incomplete', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()

    // Complete it
    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).click()
    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()

    // Uncomplete it
    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).click()

    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).not.toBeChecked()
    await expect(page.getByText('Buy milk')).not.toHaveClass(/line-through/)
  })
})
