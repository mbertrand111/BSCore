import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  event: text('event').notNull(),
  // user_id: subject of the event (the affected user).
  // No FK to auth.users — audit records must outlive user deletion for compliance.
  userId: uuid('user_id'),
  // actor_id: who performed the action (e.g. the super_admin who changed the role).
  // Null when the subject and actor are the same or the actor is unknown.
  actorId: uuid('actor_id'),
  // Non-sensitive context: resource IDs, changed fields, etc. Never passwords or tokens.
  meta: jsonb('meta').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
