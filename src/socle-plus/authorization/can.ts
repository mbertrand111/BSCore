import type { AuthenticatedUser, Action } from './authorization.types'
import { getPermissionsForRole } from './permission-registry'

/**
 * Returns true if the user is allowed to perform action on resource.
 *
 * Evaluation rules:
 *  - super_admin: always true, regardless of declared permissions
 *  - admin: true only if the action (or 'manage') is declared for admin on the resource
 */
export function can(user: AuthenticatedUser, action: Action, resource: string): boolean {
  if (user.role === 'super_admin') return true
  const permissions = getPermissionsForRole(resource, user.role)
  return permissions.has('manage') || permissions.has(action)
}
