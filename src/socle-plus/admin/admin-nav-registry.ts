import type { AuthenticatedUser, UserRole } from '@/socle-plus/auth/auth.types'
import type { AdminNavItem } from './admin.types'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 1,
  super_admin: 2,
}

const navItems: AdminNavItem[] = []

/**
 * Register a navigation item in the admin shell.
 * Idempotent — duplicate hrefs are silently ignored.
 * Intended to be called by module register() functions at activation time.
 */
export function registerAdminNav(item: AdminNavItem): void {
  if (navItems.some((existing) => existing.href === item.href)) return
  navItems.push(item)
}

/**
 * Returns the nav items visible to the given user, filtered by role hierarchy.
 * Items whose requiredRole exceeds the user's role are excluded.
 */
export function getAdminNav(user: AuthenticatedUser): AdminNavItem[] {
  const userLevel = ROLE_HIERARCHY[user.role]
  return navItems.filter((item) => userLevel >= ROLE_HIERARCHY[item.requiredRole])
}

/** Resets the nav registry. Intended for use in tests only. */
export function clearAdminNav(): void {
  navItems.length = 0
}
