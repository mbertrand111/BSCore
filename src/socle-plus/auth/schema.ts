import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

/**
 * Stores the application-level role for a Supabase Auth user.
 * One row per user — user_id is both the primary key and the unique constraint.
 * role values are enforced by a CHECK constraint in the migration.
 */
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').primaryKey(),
  role: varchar('role', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
