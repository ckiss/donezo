import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('app loads and displays heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Donezo')
})

test('axe-core is importable and runs without errors', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  // Verifies @axe-core/playwright works; actual WCAG audit is Story 4.2
  expect(results.violations).toBeInstanceOf(Array)
})
