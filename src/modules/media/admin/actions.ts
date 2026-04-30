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

const GENERIC_ERROR = "Impossible de terminer l'action. Veuillez réessayer."
const GENERIC_UPLOAD_ERROR = "Le téléversement a échoué. Veuillez réessayer."

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface SingleUploadResult {
  readonly ok: boolean
  readonly id?: string
  readonly originalFilename: string
  readonly error?: string
}

/**
 * Single-file upload action with a clean Promise<Result> signature, designed
 * to be called directly from a Client Component (via useTransition) one file
 * at a time. Returns success/failure rather than redirecting, so the caller
 * can orchestrate multiple uploads, accumulate per-file status, and decide
 * when to navigate.
 *
 * The legacy useActionState entry-point is replaced by this — the multi-file
 * uploader (MediaUploadForm) loops over selected files, awaits each call, and
 * surfaces a per-file timeline.
 *
 * Alt text is optional and per-file — the multi-file UI exposes one input
 * per row so users can describe each image before submitting. Empty alt is
 * accepted; users can fill it later via /admin/media/[id].
 */
export async function uploadSingleMediaAction(formData: FormData): Promise<SingleUploadResult> {
  const user = await requireAdminAuth()

  const fileEntry = formData.get('file')
  if (!(fileEntry instanceof File)) {
    return { ok: false, originalFilename: 'inconnu', error: 'Aucun fichier reçu.' }
  }

  // Alt text — optional per upload. Validated through the same schema as the
  // edit form to keep the constraint single-sourced.
  const altRaw = formData.get('altText')
  const altText = typeof altRaw === 'string' ? altRaw : ''
  const altParsed = altTextSchema.safeParse(altText)
  if (!altParsed.success) {
    return {
      ok: false,
      originalFilename: fileEntry.name,
      error: altParsed.error.issues[0]?.message ?? 'Texte alternatif invalide.',
    }
  }

  // Validate file metadata (mime, size, name) — server-side authority even
  // when the client filters too. Schema messages are already in French.
  const metaParsed = fileMetadataSchema.safeParse({
    name: fileEntry.name,
    type: fileEntry.type,
    size: fileEntry.size,
  })
  if (!metaParsed.success) {
    return {
      ok: false,
      originalFilename: fileEntry.name,
      error: metaParsed.error.issues[0]?.message ?? 'Fichier invalide.',
    }
  }

  // Optional folder destination — read raw from the FormData. Validation
  // happens at the FK layer (an unknown UUID raises a constraint error,
  // which we translate into a generic message).
  const folderRaw = formData.get('folderId')
  const folderId = typeof folderRaw === 'string' && folderRaw !== '' ? folderRaw : null

  let asset
  try {
    asset = await uploadMediaAsset({
      file: fileEntry,
      altText: altParsed.data,
      createdBy: user.id,
      folderId,
    })
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: {
        action: 'media.asset.uploaded',
        id: asset.id,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        originalFilename: asset.originalFilename,
        folderId,
      },
    })
  } catch (error) {
    logger.error('[media] uploadSingleMediaAction failed', {
      filename: fileEntry.name,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      ok: false,
      originalFilename: fileEntry.name,
      error: GENERIC_UPLOAD_ERROR,
    }
  }

  revalidatePath('/admin/media')
  return { ok: true, id: asset.id, originalFilename: asset.originalFilename }
}

/** @deprecated kept for the legacy single-file form pattern — prefer
 *  `uploadSingleMediaAction` in new code. */
export async function uploadMediaAction(
  _prev: MediaUploadFormState,
  formData: FormData,
): Promise<MediaUploadFormState> {
  const user = await requireAdminAuth()

  const fileEntry = formData.get('file')
  const altRaw = formData.get('altText')
  const altText = typeof altRaw === 'string' ? altRaw : ''

  const altParsed = altTextSchema.safeParse(altText)
  if (!altParsed.success) {
    return {
      error: null,
      fieldErrors: { altText: altParsed.error.issues[0]?.message ?? 'Texte alternatif invalide' },
      values: { altText },
    }
  }

  if (!(fileEntry instanceof File)) {
    return {
      error: null,
      fieldErrors: { file: 'Veuillez choisir un fichier à téléverser.' },
      values: { altText },
    }
  }

  const metaParsed = fileMetadataSchema.safeParse({
    name: fileEntry.name,
    type: fileEntry.type,
    size: fileEntry.size,
  })
  if (!metaParsed.success) {
    return {
      error: null,
      fieldErrors: { file: metaParsed.error.issues[0]?.message ?? 'Fichier invalide' },
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
