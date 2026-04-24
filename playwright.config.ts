import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  // Fail fast in CI — no retries locally
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  // exactOptionalPropertyTypes: omit the key rather than assigning undefined
  ...(process.env['CI'] ? { workers: 1 } : {}),
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start the dev server automatically when running E2E tests locally.
  // In CI, the server must already be running.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
