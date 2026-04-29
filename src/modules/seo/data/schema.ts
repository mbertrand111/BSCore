import { pgTable, uuid, text, varchar, boolean, timestamp } from 'drizzle-orm/pg-core'

/**
 * Per-route SEO metadata managed in the admin shell.
 *
 * One row per route (unique). The `route` column is a normalized path,
 * always starting with `/`, never including query strings. Forbidden
 * routes (admin / api / dev / login) are blocked by the Zod validator,
 * not by a DB constraint — keeps the schema portable and testable
 * outside the validator's policy decisions.
 */
export const seoEntries = pgTable('seo_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  route: varchar('route', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 70 }).notNull(),
  description: varchar('description', { length: 160 }).notNull(),
  canonicalUrl: text('canonical_url'),
  robotsIndex: boolean('robots_index').notNull().default(true),
  robotsFollow: boolean('robots_follow').notNull().default(true),
  ogTitle: varchar('og_title', { length: 70 }),
  ogDescription: varchar('og_description', { length: 200 }),
  ogImageUrl: text('og_image_url'),
  twitterTitle: varchar('twitter_title', { length: 70 }),
  twitterDescription: varchar('twitter_description', { length: 200 }),
  twitterImageUrl: text('twitter_image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type SeoEntryRow = typeof seoEntries.$inferSelect
