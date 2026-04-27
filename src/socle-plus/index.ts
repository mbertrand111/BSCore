// ── Database layer
export { db, checkDatabaseHealth, runMigrations, applyMigrations } from './database'
export type { Db, Migration, MigrationFn, MigrationRecord } from './database'

// ── Auth layer (session identity + role persistence)
// Note: getAuthUser/requireAuthUser are NOT re-exported here — the authorization
// layer's versions (which require role) are the canonical public accessors.
export { authMiddleware, signIn, signOut, createSupabaseServerClient } from './auth'
export { getUserRole, setUserRole } from './auth'
export type { AuthUser, AuthenticatedUser, UserRole, SignInResult, CookieStore } from './auth'

// ── Authorization layer
export {
  can,
  declarePermissions,
  clearPermissions,
  getAuthUser,
  requireAuthUser,
  requireAuth,
  requireRole,
} from './authorization'
export type { Action } from './authorization'

// ── Admin shell
export { registerAdminNav, getAdminNav, clearAdminNav, requireAdminAuth } from './admin'
export { AdminLayout, AdminHeader, AdminSidebar } from './admin'
export type { AdminNavItem } from './admin'

// ── Audit log
export { writeAuditEvent, AUDIT_EVENTS } from './audit'
export type { AuditEventOptions, AuditEventName } from './audit'
