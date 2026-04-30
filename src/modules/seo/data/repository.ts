import 'server-only'

import { count, eq } from 'drizzle-orm'
import { db } from '@/socle-plus/database'
import { seoEntries, type SeoEntryRow } from './schema'
import type { SeoEntryInput } from '../domain/schemas'
import { normalizeRoute } from '../domain/normalize'

/**
 * Public SEO entry shape — what callers (admin pages, metadata helper)
 * see. Mirrors the row but uses camelCase consistently.
 */
export interface SeoEntry {
  id: string
  route: string
  title: string
  description: string
  canonicalUrl: string | null
  robotsIndex: boolean
  robotsFollow: boolean
  ogTitle: string | null
  ogDescription: string | null
  ogImageUrl: string | null
  twitterTitle: string | null
  twitterDescription: string | null
  twitterImageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

function mapRow(row: SeoEntryRow): SeoEntry {
  return {
    id: row.id,
    route: row.route,
    title: row.title,
    description: row.description,
    canonicalUrl: row.canonicalUrl,
    robotsIndex: row.robotsIndex,
    robotsFollow: row.robotsFollow,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImageUrl: row.ogImageUrl,
    twitterTitle: row.twitterTitle,
    twitterDescription: row.twitterDescription,
    twitterImageUrl: row.twitterImageUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function listSeoEntries(): Promise<SeoEntry[]> {
  const rows = await db.select().from(seoEntries).orderBy(seoEntries.route)
  return rows.map(mapRow)
}

export async function countSeoEntries(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(seoEntries)
  return row?.value ?? 0
}

export async function getSeoEntryById(id: string): Promise<SeoEntry | null> {
  const rows = await db.select().from(seoEntries).where(eq(seoEntries.id, id)).limit(1)
  const row = rows[0]
  return row ? mapRow(row) : null
}

export async function getSeoEntryByRoute(route: string): Promise<SeoEntry | null> {
  const normalized = normalizeRoute(route)
  const rows = await db
    .select()
    .from(seoEntries)
    .where(eq(seoEntries.route, normalized))
    .limit(1)
  const row = rows[0]
  return row ? mapRow(row) : null
}

export async function createSeoEntry(input: SeoEntryInput): Promise<SeoEntry> {
  const [row] = await db
    .insert(seoEntries)
    .values({
      route: input.route,
      title: input.title,
      description: input.description,
      canonicalUrl: input.canonicalUrl,
      robotsIndex: input.robotsIndex,
      robotsFollow: input.robotsFollow,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImageUrl: input.ogImageUrl,
      twitterTitle: input.twitterTitle,
      twitterDescription: input.twitterDescription,
      twitterImageUrl: input.twitterImageUrl,
    })
    .returning()
  if (!row) throw new Error('createSeoEntry: insert returned no row')
  return mapRow(row)
}

export async function updateSeoEntry(id: string, input: SeoEntryInput): Promise<SeoEntry> {
  const [row] = await db
    .update(seoEntries)
    .set({
      route: input.route,
      title: input.title,
      description: input.description,
      canonicalUrl: input.canonicalUrl,
      robotsIndex: input.robotsIndex,
      robotsFollow: input.robotsFollow,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImageUrl: input.ogImageUrl,
      twitterTitle: input.twitterTitle,
      twitterDescription: input.twitterDescription,
      twitterImageUrl: input.twitterImageUrl,
      updatedAt: new Date(),
    })
    .where(eq(seoEntries.id, id))
    .returning()
  if (!row) throw new Error(`updateSeoEntry: no row updated for id=${id}`)
  return mapRow(row)
}
