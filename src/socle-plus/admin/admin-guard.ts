import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/socle-plus/auth/supabase-client'
import { getUserRole } from '@/socle-plus/auth/user-roles-repository'
import type { AuthenticatedUser, CookieStore } from '@/socle-plus/auth/auth.types'

/**
 * Server-only guard for the admin shell.
 * Validates the Supabase session and resolves the user's DB role.
 * Redirects to /login if either step fails — never throws to the caller.
 * Call this at the top of every admin layout or page server component.
 */
export async function requireAdminAuth(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies()

  const store: CookieStore = {
    getAll: () => cookieStore.getAll(),
    setAll: () => {},
  }

  const supabase = createSupabaseServerClient(store)
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user || !data.user.email) {
    redirect('/login')
  }

  const { id, email } = data.user
  const role = await getUserRole(id)

  if (!role) {
    redirect('/login')
  }

  return { id, email, role }
}
