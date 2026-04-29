import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { mediaAssets } from '@/modules/media/data/schema'

/**
 * One row per CMS page.
 *
 * Cross-module reference: `main_media_asset_id` is a nullable FK to
 * `media_assets.id` with `ON DELETE SET NULL` — deleting a media asset
 * does NOT cascade-delete the page; the page just loses its main image.
 *
 * The Drizzle FK declaration is also a documentation signal: the CMS
 * module depends on the Media module's table being present. Both
 * migrations are auto-discovered by the runner regardless of which
 * modules are activated, so the FK target always exists at deploy time
 * if both migration folders are present.
 *
 * Status is stored as varchar with a CHECK constraint added in the
 * migration (CHECK status IN ('draft','published')). Drizzle infers a
 * plain string type — runtime values are narrowed to `CmsStatus` via
 * the repository mapper.
 */
export const cmsPages = pgTable('cms_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  excerpt: varchar('excerpt', { length: 500 }),
  content: text('content').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  mainMediaAssetId: uuid('main_media_asset_id').references(() => mediaAssets.id, {
    onDelete: 'set null',
  }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
})

export type CmsPageRow = typeof cmsPages.$inferSelect
