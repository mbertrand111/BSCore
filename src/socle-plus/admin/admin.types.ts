import type { UserRole } from '@/socle-plus/auth/auth.types'

export type AdminNavSection = 'view' | 'content' | 'engagement' | 'system'

export interface AdminNavItem {
  readonly label: string
  readonly href: string
  readonly icon?: string
  readonly requiredRole: UserRole
  readonly section?: AdminNavSection
  /**
   * Optional async count resolver. When provided, the sidebar displays a small
   * badge (e.g. "14") next to the label. Resolved in parallel for every item;
   * a thrown promise is swallowed so a flaky module never breaks the chrome.
   */
  readonly count?: () => Promise<number>
  /**
   * Optional UI hint — render the entry as muted / non-emphasized. Used for
   * "stub / coming soon" Système entries (Users, Settings) until those modules
   * actually ship.
   */
  readonly comingSoon?: boolean
}

export interface AdminNavGroup {
  readonly section: AdminNavSection
  readonly label: string
  readonly items: ReadonlyArray<AdminNavItemResolved>
}

export interface AdminNavItemResolved extends Omit<AdminNavItem, 'count'> {
  /** Resolved count, or undefined if no count() was set or the resolver threw. */
  readonly count?: number
}
