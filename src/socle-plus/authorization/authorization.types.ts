// UserRole and AuthenticatedUser are defined in auth (user identity layer)
// and re-exported here so authorization consumers have a single import point.
import type { UserRole, AuthenticatedUser } from '@/socle-plus/auth/auth.types'
export type { UserRole, AuthenticatedUser }

export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage'
