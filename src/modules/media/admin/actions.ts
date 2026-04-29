'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/socle-plus/admin'
import { writeAuditEvent, AUDIT_EVENTS } from '@/socle-plus/audit'
import { logger } from '@/socle/logger'
import {
  deleteMediaAsset,
  getMediaAssetById,
  updateMediaAltText,
} from '../data/repository'
import { uploadMediaAsset } from '../domain/upload'
import { deleteFromStorage } from '../domain/storage'
import { altTextSchema, fileMetadataSchema } from '../domain/schemas'
import type { MediaUploadFormState, MediaEditAltFormState } from './state'

const GENERIC_ERROR = 'Could not complete the action. Please try again.'

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export async function uploadMediaAction(
  _prev: MediaUploadFormState,
  formData: FormData,
): Promise<MediaUploadFormState> {
  const user = await requireAdminAuth()

  const fileEntry = formData.get('file')
  const altRaw = formData.get('altText')
  const altText = typeof altRaw === 'string' ? altRaw : ''

  // Validate alt text first (cheap)
  const altParsed = altTextSchema.safeParse(altText)
  if (!altParsed.success) {
    return {
      error: null,
      fieldErrors: { altText: altParsed.error.issues[0]?.message ?? 'Invalid alt text' },
      values: { altText },
    }
  }

  // The File API in Server Actions: FormDataEntryValue is `string | File`.
  if (!(fileEntry instanceof File)) {
    return {
      error: null,
      fieldErrors: { file: 'Please choose a file to upload.' },
      values: { altText },
    }
  }

  // Validate file metadata (mime, size, name)
  const metaParsed = fileMetadataSchema.safeParse({
    name: fileEntry.name,
    type: fileEntry.type,
    size: fileEntry.size,
  })
  if (!metaParsed.success) {
    return {
      error: null,
      fieldErrors: { file: metaParsed.error.issues[0]?.message ?? 'Invalid file' },
      values: { altText },
    }
  }

  let asset
  try {
    asset = await uploadMediaAsset({
      file: fileEntry,
      altText: altParsed.data,
      createdBy: user.id,
    })
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: {
        action: 'media.asset.uploaded',
        id: asset.id,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        originalFilename: asset.originalFilename,
      },
    })
  } catch (error) {
    logger.error('[media] uploadMediaAction failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: GENERIC_ERROR, values: { altText } }
  }

  revalidatePath('/admin/media')
  redirect('/admin/media')
}

// ---------------------------------------------------------------------------
// Update alt text
// ---------------------------------------------------------------------------

export async function updateMediaAltTextAction(
  id: string,
  _prev: MediaEditAltFormState,
  formData: FormData,
): Promise<MediaEditAltFormState> {
  const user = await requireAdminAuth()

  const altRaw = formData.get('altText')
  const altText = typeof altRaw === 'string' ? altRaw : ''

  const parsed = altTextSchema.safeParse(altText)
  if (!parsed.success) {
    return {
      error: null,
      fieldErrors: { altText: parsed.error.issues[0]?.message ?? 'Invalid alt text' },
      values: { altText },
    }
  }

  const existing = await getMediaAssetById(id)
  if (existing === null) {
    return { error: 'This asset no longer exists.', values: { altText } }
  }

  try {
    await updateMediaAltText(id, parsed.data)
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: { action: 'media.asset.alt_updated', id },
    })
  } catch (error) {
    logger.error('[media] updateMediaAltTextAction failed', {
      id,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: GENERIC_ERROR, values: { altText } }
  }

  revalidatePath('/admin/media')
  revalidatePath(`/admin/media/${id}`)
  redirect('/admin/media')
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------
//
// Strategy (V1, accepted) — see docs/modules/MEDIA.md for the full rationale.
//
//   1. DB row is deleted FIRST. The DB is the source of truth — once the row
//      is gone, the asset is invisible from the admin shell and any consumer
//      (CMS, Blog) can no longer link to it. This is the moment the deletion
//      is "real" from the user's point of view.
//
//   2. Storage blob is deleted SECOND, best-effort. If Supabase Storage is
//      down or the object is already gone, we LOG (logger.warn) and continue.
//      The orphan blob is harmless: nothing in the DB references it. A future
//      cleanup script (V2) can sweep blobs that have no matching row.
//
//   3. Audit event is written via `writeAuditEvent`, which is itself fail-safe
//      (it catches its own DB failures and logs them — never throws). So an
//      audit failure never breaks the action — same contract as Socle+.
//
// Trade-off accepted: orphan blobs cost a bit of storage. Reverse order (Storage
// first, DB second) would give us inverse trade-off (orphan rows pointing to
// missing files = broken UI). DB-first is the safer choice.
//
// ---------------------------------------------------------------------------

export async function deleteMediaAction(id: string): Promise<void> {
  const user = await requireAdminAuth()

  // 1. DB delete — source of truth.
  let deleted
  try {
    deleted = await deleteMediaAsset(id)
  } catch (error) {
    logger.error('[media] deleteMediaAction DB delete failed', {
      id,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error(GENERIC_ERROR)
  }

  if (deleted === null) {
    // Already deleted — idempotent, treat as success.
    revalidatePath('/admin/media')
    redirect('/admin/media')
  }

  // 2. Storage delete — best-effort. Orphan blob is acceptable; a manual
  //    cleanup or a future V2 sweep handles it.
  const storageOk = await deleteFromStorage(deleted.storagePath).catch(() => false)
  if (!storageOk) {
    logger.warn('[media] storage delete failed — orphan blob left behind', {
      id,
      storagePath: deleted.storagePath,
    })
  }

  await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
    actorId: user.id,
    meta: {
      action: 'media.asset.deleted',
      id,
      storagePath: deleted.storagePath,
      storageDeleted: storageOk,
    },
  })

  revalidatePath('/admin/media')
  redirect('/admin/media')
}
