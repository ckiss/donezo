import { defineConfig, devices } from '@playwright/test'

// Local dev: Vite (5173) proxies /api → Fastify (3000). CI matches production: one Fastify
// process serves dist/ and /api on 3000, so preview alone would leave nothing on 3000.
const isCI = !!process.env.CI
const baseURL = isCI ? 'http://localhost:3000' : 'http://localhost:5173'

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: isCI ? 'npm run build && npm run start' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
