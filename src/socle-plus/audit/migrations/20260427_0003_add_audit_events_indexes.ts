import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Adds query indexes to audit_events.
 *
 * Design notes:
 * - Both indexes use IF NOT EXISTS so the migration is idempotent and safe to
 *   re-run after a partial failure.
 * - audit_events_user_id_idx supports filtering by subject of the event
 *   (e.g. "show all events for user X" in a future admin audit view).
 * - audit_events_created_at_idx is created with DESC ordering to match the
 *   expected access pattern: most recent events first. Postgres can use this
 *   index for both directions, but DESC matches the dominant query.
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS audit_events_user_id_idx
    ON audit_events(user_id)
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS audit_events_created_at_idx
    ON audit_events(created_at DESC)
  `)
}
