'use server'

import { requireAdminAuth } from '@/socle-plus/admin'
import { listMediaAssets, type MediaAsset } from '@/modules/media/data/repository'
import {
  listMediaFoldersWithCounts,
  type MediaFolderWithCount,
} from '@/modules/media/data/folders-repository'

/**
 * Lightweight payload returned to the MediaPicker modal in the CMS block
 * editor. Trimmed to the fields the picker actually renders so we don't
 * ship 500 KB of metadata to the client when picking from a large library.
 */
export interface PickerAsset {
  readonly id: string
  readonly originalFilename: string
  readonly altText: string
  readonly publicUrl: string
  readonly mimeType: string
  readonly folderId: string | null
}

export interface PickerFolder {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly assetCount: number
}

export interface PickerData {
  readonly folders: ReadonlyArray<PickerFolder>
  readonly unclassifiedCount: number
  readonly totalCount: number
  readonly assets: ReadonlyArray<PickerAsset>
}

/**
 * Server Action invoked by the MediaPicker modal when it (re)loads.
 *
 *   folder: undefined → all assets
 *   folder: null      → only unclassified
 *   folder: string    → only that folder
 *
 * Auth is enforced (requireAdminAuth) — the picker is admin-only.
 *
 * Search is applied client-side after fetch — small libraries (≤ 1000
 * assets) make this trivially fast and avoids a roundtrip on each
 * keystroke. For very large libraries V2 can switch to a server-side
 * full-text query.
 */
export async function listMediaForPicker(
  folder?: string | null,
): Promise<PickerData> {
  await requireAdminAuth()

  const [foldersData, assets] = await Promise.all([
    listMediaFoldersWithCounts(),
    listMediaAssets(folder),
  ])

  return {
    folders: foldersData.folders.map(toPickerFolder),
    unclassifiedCount: foldersData.unclassifiedCount,
    totalCount: foldersData.totalCount,
    assets: assets.map(toPickerAsset),
  }
}

function toPickerFolder(f: MediaFolderWithCount): PickerFolder {
  return {
    id: f.id,
    name: f.name,
    slug: f.slug,
    assetCount: f.assetCount,
  }
}

function toPickerAsset(a: MediaAsset): PickerAsset {
  return {
    id: a.id,
    originalFilename: a.originalFilename,
    altText: a.altText,
    publicUrl: a.publicUrl,
    mimeType: a.mimeType,
    folderId: a.folderId,
  }
}
