import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/socle-plus/database'
import { cmsPages, type CmsPageRow } from './schema'
import type { CmsPageInput } from '../domain/schemas'
import type { CmsStatus } from '../constants'
import { normalizeSlug } from '../domain/slug'

export interface CmsPage {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  status: CmsStatus
  mainMediaAssetId: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
}

function mapRow(row: CmsPageRow): CmsPage {
  // Status is stored as varchar — narrow to CmsStatus. The CHECK
  // constraint guarantees only 'draft' or 'published' are persisted.
  const status: CmsStatus = row.status === 'published' ? 'published' : 'draft'
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    status,
    mainMediaAssetId: row.mainMediaAssetId,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listCmsPages(): Promise<CmsPage[]> {
  const rows = await db.select().from(cmsPages).orderBy(desc(cmsPages.updatedAt))
  return rows.map(mapRow)
}

export async function listPublishedCmsPages(): Promise<CmsPage[]> {
  const rows = await db
    .select()
    .from(cmsPages)
    .where(eq(cmsPages.status, 'published'))
    .orderBy(desc(cmsPages.publishedAt))
  return rows.map(mapRow)
}

export async function getCmsPageById(id: string): Promise<CmsPage | null> {
  const rows = await db.select().from(cmsPages).where(eq(cmsPages.id, id)).limit(1)
  const row = rows[0]
  return row ? mapRow(row) : null
}

export async function getCmsPageBySlug(slug: string): Promise<CmsPage | null> {
  const normalized = normalizeSlug(slug)
  const rows = await db
    .select()
    .from(cmsPages)
    .where(eq(cmsPages.slug, normalized))
    .limit(1)
  const row = rows[0]
  return row ? mapRow(row) : null
}

/**
 * Public-facing accessor. Returns the page only when status === 'published'.
 * Used by the dynamic public route (`/(public)/[slug]/page.tsx`) to enforce
 * that drafts never leak via direct URL access.
 */
export async function getPublishedCmsPageBySlug(slug: string): Promise<CmsPage | null> {
  const normalized = normalizeSlug(slug)
  const rows = await db
    .select()
    .from(cmsPages)
    .where(and(eq(cmsPages.slug, normalized), eq(cmsPages.status, 'published')))
    .limit(1)
  const row = rows[0]
  return row ? mapRow(row) : null
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export interface CreateCmsPageData extends CmsPageInput {
  createdBy: string
}

export async function createCmsPage(input: CreateCmsPageData): Promise<CmsPage> {
  const now = new Date()
  const publishedAt = input.status === 'published' ? now : null

  const [row] = await db
    .insert(cmsPages)
    .values({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      mainMediaAssetId: input.mainMediaAssetId,
      createdBy: input.createdBy,
      ...(publishedAt !== null ? { publishedAt } : {}),
    })
    .returning()

  if (!row) throw new Error('createCmsPage: insert returned no row')
  return mapRow(row)
}

/**
 * Updates a page. publishedAt rule:
 *   - If status transitions FROM something other than 'published' TO 'published'
 *     → set publishedAt = now()
 *   - Otherwise (already published, or transitioning to/within draft)
 *     → leave publishedAt alone (preserves history of when first published)
 */
export async function updateCmsPage(
  id: string,
  input: CmsPageInput,
  previousStatus: CmsStatus,
): Promise<CmsPage> {
  const now = new Date()
  const setPublishedAt = previousStatus !== 'published' && input.status === 'published'

  const [row] = await db
    .update(cmsPages)
    .set({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      mainMediaAssetId: input.mainMediaAssetId,
      updatedAt: now,
      ...(setPublishedAt ? { publishedAt: now } : {}),
    })
    .where(eq(cmsPages.id, id))
    .returning()

  if (!row) throw new Error(`updateCmsPage: no row updated for id=${id}`)
  return mapRow(row)
}

export async function deleteCmsPage(id: string): Promise<CmsPage | null> {
  const [row] = await db.delete(cmsPages).where(eq(cmsPages.id, id)).returning()
  return row ? mapRow(row) : null
}
