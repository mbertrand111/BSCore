import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Adds a flat folder layer to the Media module.
 *
 *   - `media_folders` rows are user-created groupings (no nesting V1 — a
 *     single level is enough for the workflows we have today; a nested
 *     model can be added later behind the same table by adding a
 *     `parent_id UUID REFERENCES media_folders(id)` column).
 *   - `media_assets.folder_id` is a nullable FK; deleting a folder sets
 *     the asset's folder back to NULL ("Non classés"). We never
 *     cascade-delete media when a folder goes away — losing files is
 *     irreversible, losing a label is not.
 *   - `slug` is unique and stable. The UI generates it from the name and
 *     the user can override it during creation. Used for future deep
 *     links (`/admin/media?folder=<slug>`) once a query-string filter
 *     replaces the in-memory client filter.
 *
 * Idempotent (`IF NOT EXISTS`) so repeated migration runs are safe.
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS media_folders (
      id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      name         VARCHAR(120) NOT NULL,
      slug         VARCHAR(140) NOT NULL,
      description  VARCHAR(500),
      created_by   UUID         NOT NULL,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS media_folders_slug_idx
    ON media_folders(slug)
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS media_folders_name_idx
    ON media_folders(LOWER(name))
  `)

  // Add folder_id to media_assets — nullable, ON DELETE SET NULL so
  // dropping a folder relabels its assets as "Non classés" without
  // losing them.
  await db.execute(sql`
    ALTER TABLE media_assets
    ADD COLUMN IF NOT EXISTS folder_id UUID
    REFERENCES media_folders(id) ON DELETE SET NULL
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS media_assets_folder_id_idx
    ON media_assets(folder_id)
  `)
}
