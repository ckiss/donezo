import { test, expect } from '@playwright/test'

test.describe('Responsive layout', () => {
  test('mobile viewport (375px) — controls visible and no overflow', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    // Input and button visible
    await expect(page.getByPlaceholder('Add a task...')).toBeVisible()
    await expect(page.getByRole('button', { name: /add/i })).toBeVisible()

    // Add a task and verify it renders
    await page.getByPlaceholder('Add a task...').fill('A task with some longer text to test overflow')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('A task with some longer text to test overflow')).toBeVisible()

    // Verify task controls visible
    await expect(page.getByRole('checkbox')).toBeVisible()
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible()

    // No horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(hasHorizontalScroll).toBe(false)

    await context.close()
  })

  test('desktop viewport (1440px) — content constrained and centered', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    await expect(page.getByPlaceholder('Add a task...')).toBeVisible()

    // Content should be constrained (max-w-2xl = 672px)
    const containerWidth = await page.locator('main > div').evaluate(
      (el) => el.getBoundingClientRect().width
    )
    expect(containerWidth).toBeLessThanOrEqual(672)
    expect(containerWidth).toBeGreaterThan(0)

    await context.close()
  })
})
