import { UnauthorizedError, ForbiddenError } from '@/socle/errors'
import type { MiddlewareFunction, RequestContext } from '@/socle/middleware'
import type { AuthenticatedUser, UserRole } from './authorization.types'

const USER_META_KEY = 'socle.user'

// Numeric weight per role — higher value = greater privilege.
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 1,
  super_admin: 2,
}

/**
 * Returns the authenticated user from context, or null if absent or incomplete.
 * Requires a valid role field — ctx.meta['socle.user'] without a role returns null.
 */
export function getAuthUser(ctx: RequestContext): AuthenticatedUser | null {
  const raw = ctx.meta[USER_META_KEY]
  if (!isAuthenticatedUser(raw)) return null
  return raw
}

/**
 * Returns the authenticated user or throws UnauthorizedError.
 * Use in server actions and route handlers that require a logged-in user with a role.
 */
export function requireAuthUser(ctx: RequestContext): AuthenticatedUser {
  const user = getAuthUser(ctx)
  if (!user) throw new UnauthorizedError('Authentication required')
  return user
}

/**
 * Middleware that requires at least admin role.
 * Alias for requireRole('admin') — the minimum level to access any admin resource.
 */
export function requireAuth(): MiddlewareFunction {
  return requireRole('admin')
}

/**
 * Middleware that requires the user to hold at least minimumRole.
 * Throws UnauthorizedError if no user is present, ForbiddenError if role is insufficient.
 * super_admin satisfies any minimumRole (including 'admin').
 */
export function requireRole(minimumRole: UserRole): MiddlewareFunction {
  return async (ctx, next) => {
    const user = getAuthUser(ctx)
    if (!user) throw new UnauthorizedError('Authentication required')
    if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minimumRole]) {
      throw new ForbiddenError('Insufficient permissions')
    }
    await next()
  }
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj['id'] === 'string' &&
    typeof obj['email'] === 'string' &&
    isUserRole(obj['role'])
  )
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'super_admin'
}
