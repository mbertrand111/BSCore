import { logger } from '@/socle/logger'
import type { AuthenticatedUser, UserRole } from '@/socle-plus/auth/auth.types'
import type {
  AdminNavGroup,
  AdminNavItem,
  AdminNavItemResolved,
  AdminNavSection,
} from './admin.types'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 1,
  super_admin: 2,
}

const SECTION_ORDER: ReadonlyArray<AdminNavSection> = [
  'view',
  'content',
  'engagement',
  'system',
]
const SECTION_LABELS: Record<AdminNavSection, string> = {
  view: 'Vue',
  content: 'Contenu',
  engagement: 'Engagement',
  system: 'Système',
}

const navItems: AdminNavItem[] = []

/**
 * Register a navigation item in the admin shell.
 * Idempotent — duplicate hrefs are silently ignored. Intended to be called by
 * module register() functions and by registerCoreNav() at activation time.
 */
export function registerAdminNav(item: AdminNavItem): void {
  if (navItems.some((existing) => existing.href === item.href)) return
  navItems.push(item)
}

function visibleTo(item: AdminNavItem, user: AuthenticatedUser): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[item.requiredRole]
}

/**
 * Returns the nav items visible to the given user, filtered by role hierarchy.
 * Items whose requiredRole exceeds the user's role are excluded.
 *
 * Kept for backward compatibility with the old flat sidebar — new chrome uses
 * getGroupedAdminNav() which buckets by section and resolves count callbacks.
 */
export function getAdminNav(user: AuthenticatedUser): AdminNavItem[] {
  return navItems.filter((item) => visibleTo(item, user))
}

/**
 * Returns nav items grouped by section, in canonical order (Vue → Modules →
 * Système). Each item has its `count()` callback resolved in parallel; if a
 * resolver throws, the badge is omitted (the entry still renders) and the
 * error is logged. Empty sections are dropped.
 *
 * Use this from server-rendered admin layouts. Counts run on every render —
 * keep the underlying queries cheap (a single COUNT(*) per module).
 */
export async function getGroupedAdminNav(
  user: AuthenticatedUser,
): Promise<AdminNavGroup[]> {
  const visible = navItems.filter((item) => visibleTo(item, user))

  const resolved: AdminNavItemResolved[] = await Promise.all(
    visible.map(async (item) => {
      const { count, ...rest } = item
      if (count === undefined) return rest
      try {
        const value = await count()
        return { ...rest, count: value }
      } catch (error) {
        logger.warn('[admin-nav] count resolver failed — badge omitted', {
          href: item.href,
          error: error instanceof Error ? error.message : String(error),
        })
        return rest
      }
    }),
  )

  return SECTION_ORDER.map((section) => ({
    section,
    label: SECTION_LABELS[section],
    items: resolved.filter((item) => (item.section ?? 'content') === section),
  })).filter((group) => group.items.length > 0)
}

/** Resets the nav registry. Intended for use in tests only. */
export function clearAdminNav(): void {
  navItems.length = 0
}
