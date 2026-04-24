import { test, expect } from '@playwright/test'

// Smoke test: verifies the home page renders without crashing.
// This is the minimal E2E test — it confirms the Next.js app boots
// and the root page responds with expected content.
test('home page renders BSCore heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('BSCore')
})

test('home page returns 200 status', async ({ request }) => {
  const response = await request.get('/')
  expect(response.status()).toBe(200)
})
