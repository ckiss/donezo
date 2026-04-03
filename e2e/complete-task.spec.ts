import { test, expect } from '@playwright/test'

test.describe('Complete task', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('marks task as completed with visual indicator within 300ms', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')

    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).check()

    await expect(page.getByText('Buy milk')).toHaveClass(/line-through/, { timeout: 300 })
    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()
  })

  test('completed state persists after page reload', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).check()

    await page.reload()

    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()
    await expect(page.getByText('Buy milk')).toHaveClass(/line-through/)
  })

  test('unchecking a completed task reverts to incomplete', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).check()
    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).toBeChecked()

    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).uncheck()

    await expect(page.getByRole('checkbox', { name: /mark "Buy milk"/i })).not.toBeChecked({ timeout: 300 })
    await expect(page.getByText('Buy milk')).not.toHaveClass(/line-through/)
  })
})
