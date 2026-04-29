import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Creates the media_assets table — one row per uploaded media asset.
 *
 * Design notes:
 *   - `storage_path` is unique and acts as the canonical key in Supabase
 *     Storage (bucket: `media`).
 *   - `created_by` references a Supabase Auth user UUID. No FK — the
 *     asset and the upload audit must survive user deletion (same
 *     reasoning as `audit_events.user_id`).
 *   - V1 uses hard delete: no `deleted_at` column.
 *   - Idempotent (`IF NOT EXISTS`) so repeated migration runs are safe.
 *
 * Deployment requirement (NOT created by this migration):
 *   The Supabase Storage bucket `media` must exist with PUBLIC read
 *   access. Create it once via the Supabase dashboard or CLI before
 *   the first upload. The bucket name is configured in
 *   src/modules/media/constants.ts.
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS media_assets (
      id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      storage_path        VARCHAR(512) NOT NULL,
      original_filename   VARCHAR(255) NOT NULL,
      mime_type           VARCHAR(100) NOT NULL,
      size_bytes          INTEGER      NOT NULL,
      alt_text            VARCHAR(500) NOT NULL DEFAULT '',
      created_by          UUID         NOT NULL,
      created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS media_assets_storage_path_idx
    ON media_assets(storage_path)
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS media_assets_created_at_idx
    ON media_assets(created_at DESC)
  `)
}
