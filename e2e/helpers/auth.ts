import type { Page } from '@playwright/test'

/**
 * Login helpers for E2E tests.
 *
 * Reads test credentials from process.env (set via .env.local for local
 * dev, or CI secrets in pipelines). The seed script `npm run seed:e2e`
 * creates the corresponding Supabase users + user_roles rows.
 *
 * These helpers never mock the auth flow — they post the form and follow
 * the real Server Action through Supabase, exactly like a user would.
 */
export type E2ERole = 'admin' | 'super_admin' | 'none'

interface E2ECredentials {
  email: string
  password: string
}

export function readCredentials(role: E2ERole): E2ECredentials | null {
  const map: Record<E2ERole, [string, string]> = {
    super_admin: ['E2E_SUPER_ADMIN_EMAIL', 'E2E_SUPER_ADMIN_PASSWORD'],
    admin: ['E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD'],
    none: ['E2E_USER_EMAIL', 'E2E_USER_PASSWORD'],
  }
  const [emailKey, passwordKey] = map[role]
  const email = process.env[emailKey]
  const password = process.env[passwordKey]
  if (!email || !password) return null
  return { email, password }
}

/**
 * Returns true when both Supabase config and at least the admin
 * credentials are present in the environment. Tests that require auth
 * should `test.skip(!isE2EAuthReady(), ...)`.
 */
export function isE2EAuthReady(): boolean {
  if (!process.env['SUPABASE_URL'] || !process.env['SUPABASE_ANON_KEY']) return false
  const adminCreds = readCredentials('admin')
  return adminCreds !== null
}

/**
 * Logs in via the /login form and waits for the resulting redirect to
 * settle. Throws if the credentials for the requested role are missing.
 */
export async function loginAs(page: Page, role: 'admin' | 'super_admin'): Promise<void> {
  const creds = readCredentials(role)
  if (!creds) {
    throw new Error(`Missing E2E credentials for role "${role}". Set the env vars and run npm run seed:e2e.`)
  }

  await page.goto('/login')
  await page.getByTestId('login-email-input').fill(creds.email)
  await page.getByTestId('login-password-input').fill(creds.password)
  await page.getByTestId('login-submit').click()

  // Successful login redirects to /admin (or the validated returnTo).
  // Wait for the URL to leave /login.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })
}

export async function loginAsAdmin(page: Page): Promise<void> {
  return loginAs(page, 'admin')
}

export async function loginAsSuperAdmin(page: Page): Promise<void> {
  return loginAs(page, 'super_admin')
}
