import { UnauthorizedError, toAppError } from '@/socle/errors'
import { logger } from '@/socle/logger'
import type { MiddlewareFunction, RequestContext } from '@/socle/middleware'
import { createSupabaseServerClient } from './supabase-client'
import type { AuthUser, CookieStore } from './auth.types'
import { getUserRole } from './user-roles-repository'

const USER_META_KEY = 'socle.user'
const COOKIES_META_KEY = 'socle.request.cookies'

export const authMiddleware: MiddlewareFunction = async (ctx, next) => {
  const cookieStore = ctx.meta[COOKIES_META_KEY]

  if (!isCookieStore(cookieStore)) {
    // No cookies in context — continue unauthenticated
    await next()
    return
  }

  try {
    const supabase = createSupabaseServerClient(cookieStore)
    const { data, error } = await supabase.auth.getUser()

    // Only proceed when we have a verified identity.
    // getUser() validates the JWT server-side — never trust getSession() alone.
    if (!error && data.user?.email) {
      const role = await getUserRole(data.user.id)

      // Only set the user when a role is found.
      // A user in Supabase with no row in user_roles is treated as unauthenticated
      // for admin purposes — no default role is assigned.
      if (role !== null) {
        const user: AuthUser = { id: data.user.id, email: data.user.email, role }
        ctx.meta[USER_META_KEY] = user
      }
    }
  } catch (error) {
    const appError = toAppError(error)
    logger.error('[auth] unexpected error during authentication', {
      code: appError.code,
      message: appError.message,
    })
    // Do not throw — downstream requireAuthUser() / requireAuth() handles rejection
  }

  await next()
}

export function getAuthUser(ctx: RequestContext): AuthUser | null {
  const raw = ctx.meta[USER_META_KEY]
  if (!isAuthUser(raw)) return null
  return raw
}

export function requireAuthUser(ctx: RequestContext): AuthUser {
  const user = getAuthUser(ctx)
  if (!user) throw new UnauthorizedError('Authentication required')
  return user
}

function isCookieStore(value: unknown): value is CookieStore {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['getAll'] === 'function'
  )
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return typeof obj['id'] === 'string' && typeof obj['email'] === 'string'
}
