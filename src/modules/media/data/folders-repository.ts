import 'server-only'

import { count, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/socle-plus/database'
import { mediaAssets, mediaFolders, type MediaFolderRow } from './schema'
import type { FolderInput } from '../domain/folder-schemas'

/**
 * Public folder shape — what callers (admin pages, server actions) see.
 * `assetCount` is computed lazily by `listMediaFoldersWithCounts()`; basic
 * reads (`get*`) skip it because counting on every fetch is wasteful.
 */
export interface MediaFolder {
  id: string
  name: string
  slug: string
  description: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface MediaFolderWithCount extends MediaFolder {
  assetCount: number
}

function mapRow(row: MediaFolderRow): MediaFolder {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listMediaFolders(): Promise<MediaFolder[]> {
  const rows = await db.select().from(mediaFolders).orderBy(mediaFolders.name)
  return rows.map(mapRow)
}

/**
 * Lists folders with their asset count in a single trip. The result also
 * includes the special "Non classés" bucket count (assets with no folder)
 * — surfaced as `unclassifiedCount` on the return shape so the sidebar can
 * render that row alongside the folders without a second query.
 */
export async function listMediaFoldersWithCounts(): Promise<{
  folders: MediaFolderWithCount[]
  unclassifiedCount: number
  totalCount: number
}> {
  const [folderRows, countRows, totalRow] = await Promise.all([
    db.select().from(mediaFolders).orderBy(mediaFolders.name),
    db
      .select({ folderId: mediaAssets.folderId, value: count() })
      .from(mediaAssets)
      .groupBy(mediaAssets.folderId),
    db.select({ value: count() }).from(mediaAssets),
  ])

  const countByFolderId = new Map<string, number>()
  let unclassifiedCount = 0
  for (const row of countRows) {
    if (row.folderId === null) unclassifiedCount = row.value
    else countByFolderId.set(row.folderId, row.value)
  }

  const folders: MediaFolderWithCount[] = folderRows.map((row) => ({
    ...mapRow(row),
    assetCount: countByFolderId.get(row.id) ?? 0,
  }))

  return {
    folders,
    unclassifiedCount,
    totalCount: totalRow[0]?.value ?? 0,
  }
}

export async function getMediaFolderById(id: string): Promise<MediaFolder | null> {
  const rows = await db.select().from(mediaFolders).where(eq(mediaFolders.id, id)).limit(1)
  const row = rows[0]
  return row ? mapRow(row) : null
}

export async function getMediaFolderBySlug(slug: string): Promise<MediaFolder | null> {
  const rows = await db.select().from(mediaFolders).where(eq(mediaFolders.slug, slug)).limit(1)
  const row = rows[0]
  return row ? mapRow(row) : null
}

export async function countAssetsInFolder(folderId: string | null): Promise<number> {
  const where = folderId === null ? isNull(mediaAssets.folderId) : eq(mediaAssets.folderId, folderId)
  const [row] = await db.select({ value: count() }).from(mediaAssets).where(where)
  return row?.value ?? 0
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export interface CreateFolderData extends FolderInput {
  createdBy: string
}

export async function createMediaFolder(input: CreateFolderData): Promise<MediaFolder> {
  const [row] = await db
    .insert(mediaFolders)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      createdBy: input.createdBy,
    })
    .returning()
  if (!row) throw new Error('createMediaFolder: insert returned no row')
  return mapRow(row)
}

export async function updateMediaFolder(
  id: string,
  input: FolderInput,
): Promise<MediaFolder> {
  const [row] = await db
    .update(mediaFolders)
    .set({
      name: input.name,
      slug: input.slug,
      description: input.description,
      updatedAt: new Date(),
    })
    .where(eq(mediaFolders.id, id))
    .returning()
  if (!row) throw new Error(`updateMediaFolder: no row updated for id=${id}`)
  return mapRow(row)
}

export async function deleteMediaFolder(id: string): Promise<MediaFolder | null> {
  // ON DELETE SET NULL on the FK takes care of demoting child assets.
  const [row] = await db.delete(mediaFolders).where(eq(mediaFolders.id, id)).returning()
  return row ? mapRow(row) : null
}

/**
 * Move a media asset to a folder, or to the "Non classés" bucket when
 * `folderId` is null.
 */
export async function moveAssetToFolder(
  assetId: string,
  folderId: string | null,
): Promise<void> {
  await db
    .update(mediaAssets)
    .set({ folderId, updatedAt: new Date() })
    .where(eq(mediaAssets.id, assetId))
}

/**
 * Sentinel re-export of the SQL count helper so call-sites that need a
 * `COUNT(*)` of all folders without loading them stay one-line.
 */
export async function countMediaFolders(): Promise<number> {
  const [row] = await db.select({ value: sql<number>`count(*)`.mapWith(Number) }).from(mediaFolders)
  return row?.value ?? 0
}
