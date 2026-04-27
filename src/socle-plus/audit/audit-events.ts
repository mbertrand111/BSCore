/**
 * Canonical audit event name constants.
 *
 * Active events (wired to callers in this codebase):
 *   USER_ROLE_ASSIGNED, USER_ROLE_CHANGED, USER_ROLE_REVOKED, ADMIN_ACTION
 *
 * Deferred events (constants defined for forward compatibility):
 *   USER_LOGIN, USER_LOGIN_FAILED, USER_LOGOUT
 *   These are recorded by Supabase Auth internally. Capturing them in the
 *   application audit log requires a Supabase Auth webhook and is deferred
 *   to post-V1. See SOCLE_PLUS_IMPLEMENTATION_PLAN.md §8.
 */
export const AUDIT_EVENTS = {
  USER_ROLE_ASSIGNED: 'user.role_assigned',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_ROLE_REVOKED: 'user.role_revoked',

  ADMIN_ACTION: 'admin.action',

  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_LOGOUT: 'user.logout',
} as const

export type AuditEventName = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS]
