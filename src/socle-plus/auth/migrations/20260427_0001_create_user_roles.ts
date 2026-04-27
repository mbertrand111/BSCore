import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Creates the user_roles table.
 *
 * Design notes:
 * - user_id is the primary key (enforces one role per user).
 * - role is constrained to known values at the DB level.
 * - The FK to auth.users(id) ON DELETE CASCADE is intentionally deferred to a
 *   follow-up migration. Including it here would require the Supabase auth schema
 *   to be present in the test database, which is not guaranteed in all environments.
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id     UUID         PRIMARY KEY,
      role        VARCHAR(50)  NOT NULL CHECK (role IN ('admin', 'super_admin')),
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)
}
