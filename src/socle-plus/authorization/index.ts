// Types
export type { UserRole, Action, AuthenticatedUser } from './authorization.types'

// Permission registry — called by modules at activation time
export { declarePermissions, clearPermissions } from './permission-registry'

// Authorization engine
export { can } from './can'

// Typed context accessors and middleware
export { getAuthUser, requireAuthUser, requireAuth, requireRole } from './authorization-middleware'
