import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Adds the foreign key user_roles.user_id → auth.users(id) ON DELETE CASCADE.
 *
 * Why this is a separate migration from 0001_create_user_roles:
 *   Supabase provisions the `auth` schema, not Socle+. Plain PostgreSQL test
 *   environments lack `auth.users`. Embedding the FK in the table-creation
 *   migration would break those environments.
 *
 * Environment behavior:
 *   Supabase DB                → FK is created
 *   Plain Postgres (no auth)   → migration is recorded as a no-op (RAISE NOTICE)
 *   FK already present         → idempotent skip (constraint existence guard)
 *
 * Drift caveat:
 *   If a project starts on plain Postgres (FK skipped, migration recorded),
 *   then later switches to a Supabase database, this migration will not
 *   re-run automatically — it is already in `_migrations`. To repair: either
 *   delete the row from `_migrations` and re-run, or apply the ALTER manually.
 *   Production-bound projects should always start on Supabase.
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      -- to_regclass returns NULL when the schema is missing, the table is
      -- missing, or the current role lacks visibility. All three cases mean
      -- "no Supabase auth schema reachable from here — skip the FK."
      IF to_regclass('auth.users') IS NULL THEN
        RAISE NOTICE 'auth.users not found; skipping user_roles FK creation (expected outside Supabase).';
        RETURN;
      END IF;

      -- Idempotence guard: skip if the constraint already exists.
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_roles_user_id_fkey'
          AND conrelid = 'user_roles'::regclass
      ) THEN
        RAISE NOTICE 'user_roles_user_id_fkey already exists; skipping.';
        RETURN;
      END IF;

      EXECUTE 'ALTER TABLE user_roles
               ADD CONSTRAINT user_roles_user_id_fkey
               FOREIGN KEY (user_id)
               REFERENCES auth.users(id)
               ON DELETE CASCADE';

      RAISE NOTICE 'Added FK constraint user_roles_user_id_fkey on user_roles.user_id.';
    END
    $$;
  `)
}
