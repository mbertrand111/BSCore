import type { CookieOptions } from '@supabase/ssr'

export type UserRole = 'admin' | 'super_admin'

export interface AuthUser {
  readonly id: string
  readonly email: string
  readonly role?: UserRole
}

/**
 * Narrower type: AuthUser with role guaranteed present.
 * Written to ctx.meta['socle.user'] only when both Supabase auth and
 * the user_roles DB lookup succeed. Never constructed with a default role.
 */
export interface AuthenticatedUser {
  readonly id: string
  readonly email: string
  readonly role: UserRole
}

export interface CookieStore {
  getAll(): Array<{ name: string; value: string }>
  setAll(
    cookies: Array<{ name: string; value: string; options: CookieOptions }>,
    headers: Record<string, string>,
  ): void | Promise<void>
}

export interface SignInResult {
  readonly error: string | null
}
