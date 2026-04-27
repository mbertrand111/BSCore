import { eq } from 'drizzle-orm'
import { db } from '@/socle-plus/database/db-client'
import type { UserRole } from './auth.types'
import { userRoles } from './schema'

/**
 * Returns the role for the given Supabase user ID, or null if no row exists.
 * The stored string is validated at runtime before being narrowed to UserRole.
 * An unrecognised stored value returns null rather than throwing.
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  const { role } = row
  if (role === 'admin' || role === 'super_admin') return role
  return null
}

/**
 * Inserts or updates the role for the given user ID (upsert).
 * Calling this for an existing user overwrites their role and refreshes updated_at.
 * No default role is assigned — callers must provide an explicit role.
 */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  await db
    .insert(userRoles)
    .values({ userId, role })
    .onConflictDoUpdate({
      target: userRoles.userId,
      set: { role, updatedAt: new Date() },
    })
}
