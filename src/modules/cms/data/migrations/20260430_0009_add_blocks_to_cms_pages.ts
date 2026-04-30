import { sql } from 'drizzle-orm'
import type { Db } from '@/socle-plus/database/db-client'

/**
 * Adds the structured-content layer to CMS pages.
 *
 *   - `blocks` is a JSONB column holding an ordered array of typed blocks
 *     (see `src/modules/cms/domain/blocks.ts`). Each block is a discriminated
 *     union (hero / text / gallery / cta) with its own fields.
 *   - The existing `content TEXT` column STAYS. Reasons:
 *       1. Zero data loss for pages created before blocks shipped.
 *       2. Public route fallback: when `blocks` is empty but `content` isn't,
 *          render a single Text block synthesized from `content`.
 *       3. Soft migration: pages move to the block model the first time their
 *          owner re-saves them in the editor — no SQL backfill required.
 *
 * Idempotent (`IF NOT EXISTS`) so repeated migration runs are safe.
 */
export async function up(db: Db): Promise<void> {
  await db.execute(sql`
    ALTER TABLE cms_pages
    ADD COLUMN IF NOT EXISTS blocks JSONB NOT NULL DEFAULT '[]'::jsonb
  `)
}
