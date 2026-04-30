import 'server-only'

import { count, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/socle-plus/database'
import { mediaAssets, type MediaAssetRow } from './schema'
import { getStoragePublicUrl } from '../domain/storage'

/**
 * Public media asset shape — what callers (admin pages, future helpers)
 * see. `publicUrl` is derived at read time from `storagePath`.
 */
export interface MediaAsset {
  id: string
  storagePath: string
  publicUrl: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  altText: string
  folderId: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMediaInput {
  storagePath: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  altText: string
  /** Folder to file the asset under. `null` (default) = "Non classés". */
  folderId?: string | null
  createdBy: string
}

function mapRow(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    storagePath: row.storagePath,
    publicUrl: getStoragePublicUrl(row.storagePath),
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    altText: row.altText,
    folderId: row.folderId,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * List media assets, optionally narrowed to a folder.
 *
 *   - omitted / `undefined`  → every asset
 *   - `null`                  → only assets in no folder ("Non classés")
 *   - `string`                → only assets in that folder
 */
export async function listMediaAssets(
  folderId?: string | null,
): Promise<MediaAsset[]> {
  const base = db.select().from(mediaAssets)
  const rows =
    folderId === undefined
      ? await base.orderBy(desc(mediaAssets.createdAt))
      : folderId === null
        ? await base.where(isNull(mediaAssets.folderId)).orderBy(desc(mediaAssets.createdAt))
        : await base.where(eq(mediaAssets.folderId, folderId)).orderBy(desc(mediaAssets.createdAt))
  return rows.map(mapRow)
}

export async function countMediaAssets(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(mediaAssets)
  return row?.value ?? 0
}

export async function getMediaAssetById(id: string): Promise<MediaAsset | null> {
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1)
  const row = rows[0]
  return row ? mapRow(row) : null
}

export async function createMediaAsset(input: CreateMediaInput): Promise<MediaAsset> {
  const [row] = await db.insert(mediaAssets).values(input).returning()
  if (!row) throw new Error('createMediaAsset: insert returned no row')
  return mapRow(row)
}

export async function updateMediaAltText(id: string, altText: string): Promise<MediaAsset> {
  const [row] = await db
    .update(mediaAssets)
    .set({ altText, updatedAt: new Date() })
    .where(eq(mediaAssets.id, id))
    .returning()
  if (!row) throw new Error(`updateMediaAltText: no row updated for id=${id}`)
  return mapRow(row)
}

export async function deleteMediaAsset(id: string): Promise<MediaAsset | null> {
  const [row] = await db.delete(mediaAssets).where(eq(mediaAssets.id, id)).returning()
  return row ? mapRow(row) : null
}
