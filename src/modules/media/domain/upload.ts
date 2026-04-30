import 'server-only'

import { randomUUID } from 'node:crypto'
import { MIME_TO_EXT } from '../constants'
import { createMediaAsset, type MediaAsset } from '../data/repository'
import { deleteFromStorage, uploadToStorage } from './storage'

/**
 * Upload orchestrator — combines validation, storage, and DB persistence
 * with a best-effort rollback if the DB insert fails after a successful
 * upload.
 *
 * The Server Action is responsible for AUTH and Zod validation BEFORE
 * calling this function. By the time we get here, the file has been
 * accepted (mime, size, name).
 */
export interface UploadMediaInput {
  file: File
  altText: string
  /** Supabase Auth user id of the uploader. */
  createdBy: string
  /** Optional folder to file the new asset under. `null` = no folder. */
  folderId?: string | null
}

export async function uploadMediaAsset(input: UploadMediaInput): Promise<MediaAsset> {
  const ext = MIME_TO_EXT[input.file.type]
  if (ext === undefined) {
    // Defensive: this should be caught by Zod earlier, but the function
    // is exported and could be called from another path.
    throw new Error(`Unsupported MIME type: ${input.file.type}`)
  }

  const storagePath = buildStoragePath(ext)

  // 1. Push the bytes to Supabase Storage first. If this fails, nothing
  //    has been written anywhere — caller can surface the error.
  const arrayBuffer = await input.file.arrayBuffer()
  await uploadToStorage({
    storagePath,
    contentType: input.file.type,
    body: new Uint8Array(arrayBuffer),
  })

  // 2. Persist the row. On failure, attempt to delete the storage object
  //    so we don't leak orphan blobs.
  try {
    return await createMediaAsset({
      storagePath,
      originalFilename: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
      altText: input.altText,
      folderId: input.folderId ?? null,
      createdBy: input.createdBy,
    })
  } catch (dbError) {
    // Best-effort rollback. If it fails, the operator can clean up the
    // bucket later — the asset isn't visible to the admin UI either way.
    await deleteFromStorage(storagePath).catch(() => {
      /* swallow — already in error path */
    })
    throw dbError
  }
}

/**
 * Layout: `YYYY/MM/<uuid>.<ext>` — predictable for manual bucket browsing
 * and avoids one giant directory at the root.
 */
function buildStoragePath(ext: string): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}/${month}/${randomUUID()}.${ext}`
}
