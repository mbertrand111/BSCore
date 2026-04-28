import { test, expect } from '@playwright/test'
import { isE2EAuthReady, loginAs, readCredentials } from '../../helpers/auth'

// Login flow E2E. Selectors: data-testid only, per FRONTEND.md §10.
// Tests that require real auth are gated on env presence.

test.describe('/login — unauthenticated UI', () => {
  test('renders the email and password fields', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByTestId('login-email-input')).toBeVisible()
    await expect(page.getByTestId('login-password-input')).toBeVisible()
    await expect(page.getByTestId('login-submit')).toBeVisible()
  })

  test('shows a generic error on invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByTestId('login-email-input').fill('nobody@example.com')
    await page.getByTestId('login-password-input').fill('wrong-password')
    await page.getByTestId('login-submit').click()

    const error = page.getByTestId('login-error')
    await expect(error).toBeVisible({ timeout: 10_000 })
    // Generic — never reveals which factor was wrong (SECURITY_RULES §3).
    await expect(error).toContainText('Invalid email or password')
  })

  test('preserves the email field after a failed submission', async ({ page }) => {
    await page.goto('/login')

    const email = 'preserve-me@example.com'
    await page.getByTestId('login-email-input').fill(email)
    await page.getByTestId('login-password-input').fill('wrong-password')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('login-email-input')).toHaveValue(email)
  })
})

test.describe('/login — authenticated flow', () => {
  test.skip(!isE2EAuthReady(), 'Requires SUPABASE_* and E2E_ADMIN_* env vars (run npm run seed:e2e first).')

  test('successful login as admin redirects to /admin', async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page).toHaveURL(/\/admin(\?|$)/)
  })

  test('successful login as super_admin redirects to /admin', async ({ page }) => {
    test.skip(readCredentials('super_admin') === null, 'Requires E2E_SUPER_ADMIN_* env vars.')
    await loginAs(page, 'super_admin')
    await expect(page).toHaveURL(/\/admin(\?|$)/)
  })

  test('user with no role bounces back to /login after successful Supabase auth', async ({ page }) => {
    const creds = readCredentials('none')
    test.skip(creds === null, 'Requires E2E_USER_* env vars.')
    if (creds === null) return // type narrowing for the rest

    await page.goto('/login')
    await page.getByTestId('login-email-input').fill(creds.email)
    await page.getByTestId('login-password-input').fill(creds.password)
    await page.getByTestId('login-submit').click()

    // The Server Action redirects to /admin on signIn success;
    // requireAdminAuth() then redirects back to /login because the user
    // has no row in user_roles. The final URL must be /login.
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/login(\?|$)/)
  })
})
