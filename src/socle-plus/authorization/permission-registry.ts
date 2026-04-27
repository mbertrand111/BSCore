import type { UserRole, Action } from './authorization.types'

type PermissionMap = Map<UserRole, Set<Action>>

// Module-level registry: resource → role → set of allowed actions.
// Populated by modules at activation via declarePermissions().
const registry = new Map<string, PermissionMap>()

/**
 * Declare which actions each role may perform on a resource.
 * Calling this multiple times for the same resource is allowed —
 * permissions are merged additively (union). Duplicate actions are deduplicated.
 * Intended to be called by module register() functions at activation time.
 */
export function declarePermissions(
  resource: string,
  permissions: Partial<Record<UserRole, Action[]>>,
): void {
  let resourceMap = registry.get(resource)
  if (!resourceMap) {
    resourceMap = new Map()
    registry.set(resource, resourceMap)
  }

  for (const [role, actions] of Object.entries(permissions) as [UserRole, Action[]][]) {
    let roleSet = resourceMap.get(role)
    if (!roleSet) {
      roleSet = new Set()
      resourceMap.set(role, roleSet)
    }
    for (const action of actions) {
      roleSet.add(action)
    }
  }
}

export function getPermissionsForRole(resource: string, role: UserRole): ReadonlySet<Action> {
  return registry.get(resource)?.get(role) ?? new Set<Action>()
}

/** Resets the registry. Intended for use in tests only. */
export function clearPermissions(): void {
  registry.clear()
}
