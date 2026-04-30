import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'

/**
 * Flat folder grouping for media assets.
 *
 * V1 has no nesting — a single level covers the workflows we have today.
 * A nested model can be added later by adding a `parentId` column without
 * breaking the flat use case.
 */
export const mediaFolders = pgTable('media_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type MediaFolderRow = typeof mediaFolders.$inferSelect

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
 * `folder_id` is a nullable FK to `media_folders.id` with ON DELETE SET
 * NULL — deleting a folder demotes its assets to "Non classés" rather
 * than losing them.
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
  folderId: uuid('folder_id').references(() => mediaFolders.id, {
    onDelete: 'set null',
  }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type MediaAssetRow = typeof mediaAssets.$inferSelect
