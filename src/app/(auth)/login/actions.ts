'use server'

import { redirect } from 'next/navigation'
import { signIn } from '@/socle-plus/auth/sign-helpers'
import { safeReturnTo } from './return-to'
import type { LoginFormState } from './state'

/**
 * Server Action invoked by the login form via React 19 useActionState.
 *
 * Behavior contract:
 *   - Validates that email/password are both present (field errors)
 *   - Calls the Socle+ signIn helper (never Supabase directly)
 *   - On invalid credentials: returns the same generic message regardless
 *     of which factor was wrong (SECURITY_RULES §3)
 *   - On success: redirects to the validated returnTo or /admin
 *   - Echoes the email back so the form preserves it on failure
 */
export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const emailRaw = formData.get('email')
  const passwordRaw = formData.get('password')
  const returnToRaw = formData.get('returnTo')

  const email = typeof emailRaw === 'string' ? emailRaw.trim() : ''
  const password = typeof passwordRaw === 'string' ? passwordRaw : ''

  const fieldErrors: { email?: string; password?: string } = {}
  if (email.length === 0) fieldErrors.email = 'Email is required'
  if (password.length === 0) fieldErrors.password = 'Password is required'

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors, email }
  }

  const result = await signIn(email, password)

  if (result.error !== null) {
    return { error: 'Invalid email or password.', email }
  }

  const target = safeReturnTo(typeof returnToRaw === 'string' ? returnToRaw : null)
  redirect(target)
}
