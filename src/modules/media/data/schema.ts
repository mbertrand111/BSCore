import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'

/**
 * One row per uploaded media asset.
 *
 * Storage path is the canonical key — the public URL is derived at read
 * time so we never store stale URLs (bucket rename, host change…).
 *
 * `created_by` holds the Supabase Auth user id of the uploader. No FK
 * here for the same compliance reason as `audit_events.user_id`: an
 * uploaded asset must survive the deletion of its uploader.
 *
 * V1 uses HARD DELETE — when an asset is removed, the DB row goes first,
 * the storage blob second (best-effort). No `deleted_at` column.
 */
export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  storagePath: varchar('storage_path', { length: 512 }).notNull().unique(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  altText: varchar('alt_text', { length: 500 }).notNull().default(''),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type MediaAssetRow = typeof mediaAssets.$inferSelect
