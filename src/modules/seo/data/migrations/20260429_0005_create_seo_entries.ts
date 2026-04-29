import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Creates the seo_entries table — per-route SEO metadata managed by the
 * SEO module's admin section.
 *
 * Design notes:
 *   - `route` is unique. The Zod validator normalizes paths before insert,
 *     so duplicate insertions of the same logical route are caught at the
 *     application layer; the unique index is a safety net.
 *   - No FK to any other table. SEO entries are pure content metadata.
 *   - Idempotent (`IF NOT EXISTS`) so repeated migration runs are safe.
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS seo_entries (
      id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      route                 VARCHAR(255) NOT NULL,
      title                 VARCHAR(70)  NOT NULL,
      description           VARCHAR(160) NOT NULL,
      canonical_url         TEXT         NULL,
      robots_index          BOOLEAN      NOT NULL DEFAULT true,
      robots_follow         BOOLEAN      NOT NULL DEFAULT true,
      og_title              VARCHAR(70)  NULL,
      og_description        VARCHAR(200) NULL,
      og_image_url          TEXT         NULL,
      twitter_title         VARCHAR(70)  NULL,
      twitter_description   VARCHAR(200) NULL,
      twitter_image_url     TEXT         NULL,
      created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS seo_entries_route_idx ON seo_entries(route)
  `)
}
