import { test, expect } from '@playwright/test'
import { isE2EAuthReady, loginAsAdmin } from '../../helpers/auth'

// Admin guard E2E.
// requireAdminAuth() in src/app/admin/layout.tsx must:
//   - redirect unauthenticated visitors to /login
//   - allow authenticated users with a valid role to reach /admin

const supabaseConfigured =
  Boolean(process.env['SUPABASE_URL']) && Boolean(process.env['SUPABASE_ANON_KEY'])

test.describe('/admin (unauthenticated)', () => {
  test.skip(
    !supabaseConfigured,
    'Requires SUPABASE_URL and SUPABASE_ANON_KEY (the auth guard cannot execute without them).',
  )

  test('redirects to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login(\?|$)/)
  })

  test('login form is visible after the redirect', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByTestId('login-email-input')).toBeVisible()
  })
})

test.describe('/admin (authenticated as admin)', () => {
  test.skip(!isE2EAuthReady(), 'Requires SUPABASE_* and E2E_ADMIN_* env vars (run npm run seed:e2e first).')

  test('reaches the admin shell without being redirected', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin(\?|$)/)
  })
})
