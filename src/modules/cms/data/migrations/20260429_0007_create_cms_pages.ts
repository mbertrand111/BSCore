import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Creates the cms_pages table — one row per CMS page.
 *
 * Cross-module FK:
 *   `main_media_asset_id` → `media_assets(id)` ON DELETE SET NULL.
 *   Deleting a media asset removes the reference from any pages using it
 *   (page survives, just loses the main image). Both migrations are
 *   auto-discovered by the runner regardless of `enabledModuleIds`, so
 *   `media_assets` always exists when 0007 runs (filename ordering
 *   guarantees 0006 < 0007).
 *
 * Slug uniqueness:
 *   The Zod validator rejects reserved slugs and dedups against the live
 *   row at write time; the unique index here is the safety net for race
 *   conditions and any direct DB write.
 *
 * Status check:
 *   Constrained at the DB level so a manual SQL update can never put an
 *   unexpected value in there. Application code always writes 'draft' or
 *   'published'.
 *
 * Idempotent (`IF NOT EXISTS`).
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      title                  VARCHAR(200) NOT NULL,
      slug                   VARCHAR(100) NOT NULL,
      excerpt                VARCHAR(500) NULL,
      content                TEXT         NOT NULL,
      status                 VARCHAR(20)  NOT NULL DEFAULT 'draft'
                                          CHECK (status IN ('draft', 'published')),
      main_media_asset_id    UUID         NULL
                                          REFERENCES media_assets(id) ON DELETE SET NULL,
      created_by             UUID         NOT NULL,
      created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
      published_at           TIMESTAMPTZ  NULL
    )
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS cms_pages_slug_idx ON cms_pages(slug)
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS cms_pages_status_idx ON cms_pages(status)
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS cms_pages_published_at_idx ON cms_pages(published_at DESC)
  `)
}
