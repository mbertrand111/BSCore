import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Creates the audit_events table.
 *
 * Design notes:
 * - user_id and actor_id have NO foreign key to auth.users.
 *   Audit records must survive user deletion for compliance purposes.
 *   The user_roles table uses ON DELETE CASCADE (role has no meaning without the user);
 *   the audit table does not — historical events must be preserved.
 * - meta is JSONB and must never contain passwords, tokens, or full user objects.
 * - The table is append-only by convention; no UPDATE or DELETE should target it.
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      event       TEXT         NOT NULL,
      user_id     UUID         NULL,
      actor_id    UUID         NULL,
      meta        JSONB        NULL,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)
}
