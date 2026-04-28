import type React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getEnv } from '@/socle/config/env'
import { createSupabaseServerClient } from '@/socle-plus/auth/supabase-client'
import { getUserRole } from '@/socle-plus/auth/user-roles-repository'
import type { CookieStore } from '@/socle-plus/auth/auth.types'
import { Card } from '@/shared/ui/patterns/Card'
import { LoginForm } from './login-form'
import { safeReturnTo } from './return-to'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

interface LoginPageProps {
  searchParams: Promise<{ returnTo?: string }>
}

/**
 * Server Component login page.
 *
 * Behavior:
 *   - If a valid session + role already exist, redirect to the safe returnTo
 *     (or /admin) — do not show the form to authenticated users.
 *   - Otherwise render the form. Submission happens via the Server Action
 *     in `actions.ts`, not via a client-side Supabase call.
 */
export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.JSX.Element> {
  const { returnTo: rawReturnTo } = await searchParams
  const returnTo = safeReturnTo(rawReturnTo)

  if (await isAlreadyAuthenticated()) {
    redirect(returnTo)
  }

  return (
    <Card>
      <Card.Header>
        <h1 className="text-base font-semibold text-foreground">Sign in to BSCore</h1>
      </Card.Header>
      <Card.Body>
        <LoginForm returnTo={returnTo} />
      </Card.Body>
    </Card>
  )
}

/**
 * Returns true only when both a valid Supabase session AND a user_roles row
 * exist for the current cookie. Mirrors the fail-secure logic of
 * requireAdminAuth() but inverts the redirect direction.
 */
async function isAlreadyAuthenticated(): Promise<boolean> {
  // Socle-only / unconfigured project: no Supabase, no possible session.
  // Render the form so the route is reachable in dev/CI environments.
  if (!getEnv('SUPABASE_URL') || !getEnv('SUPABASE_ANON_KEY')) return false

  try {
    const cookieStore = await cookies()
    const store: CookieStore = {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    }

    const supabase = createSupabaseServerClient(store)
    const { data, error } = await supabase.auth.getUser()

    if (error || !data.user || !data.user.email) return false

    const role = await getUserRole(data.user.id)
    return role !== null
  } catch {
    // Backend unreachable (DB down, Supabase outage). Show the form rather
    // than crashing the page — the user can retry. The real error is logged
    // by the lower layers.
    return false
  }
}
