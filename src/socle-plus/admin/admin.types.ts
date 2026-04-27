import type { UserRole } from '@/socle-plus/auth/auth.types'

export interface AdminNavItem {
  readonly label: string
  readonly href: string
  readonly icon?: string
  readonly requiredRole: UserRole
}
