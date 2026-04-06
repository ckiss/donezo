import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { clearTasks } from './helpers'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearTasks(page)
    await page.reload()
  })

  test('empty state has zero WCAG 2.1 AA violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('task list has zero WCAG 2.1 AA violations', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Buy milk')).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })

  test('completed task has zero WCAG 2.1 AA violations', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Buy milk')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await page.getByRole('checkbox', { name: /mark "Buy milk"/i }).check()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearTasks(page)
    await page.reload()
  })

  // WebKit on macOS does not Tab to buttons by default (OS-level preference)
  test('Tab order follows logical sequence', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Tab focus behavior varies across browsers/OS')
    // Add a task so we have interactive elements in the list
    await page.getByPlaceholder('Add a task...').fill('Test task')
    await page.getByPlaceholder('Add a task...').press('Enter')
    await expect(page.getByText('Test task')).toBeVisible()

    // Click body to reset focus
    await page.locator('body').click()

    // Tab through elements in order
    await page.keyboard.press('Tab')
    await expect(page.getByPlaceholder('Add a task...')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /add/i })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByRole('checkbox', { name: /mark "Test task"/i })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /delete "Test task"/i })).toBeFocused()
  })

  test('Space toggles checkbox completion', async ({ page }) => {
    await page.getByPlaceholder('Add a task...').fill('Test task')
    await page.getByPlaceholder('Add a task...').press('Enter')

    // Focus the checkbox and press Space
    await page.getByRole('checkbox', { name: /mark "Test task"/i }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByRole('checkbox', { name: /mark "Test task"/i })).toBeChecked()
  })
})
