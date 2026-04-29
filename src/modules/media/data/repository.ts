import 'server-only'

import { desc, eq } from 'drizzle-orm'
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
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function listMediaAssets(): Promise<MediaAsset[]> {
  const rows = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt))
  return rows.map(mapRow)
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
