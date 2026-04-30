'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/socle-plus/admin'
import { writeAuditEvent, AUDIT_EVENTS } from '@/socle-plus/audit'
import { logger } from '@/socle/logger'
import {
  createMediaFolder,
  deleteMediaFolder,
  getMediaFolderById,
  getMediaFolderBySlug,
  moveAssetToFolder,
  updateMediaFolder,
} from '../data/folders-repository'
import { folderInputSchema } from '../domain/folder-schemas'

const GENERIC_ERROR = "Impossible de terminer l'action. Veuillez réessayer."

export interface FolderActionResult {
  readonly ok: boolean
  readonly id?: string
  readonly slug?: string
  readonly error?: string
  readonly fieldErrors?: Record<string, string>
}

/**
 * Folder actions live in their own file because they have a different
 * shape than the asset actions (clean Promise<Result> instead of the
 * useActionState pattern). The MediaLibrary calls them from a Client
 * Component via useTransition, never from a `<form action>` directly.
 *
 * Audit: every mutation writes an event so the dashboard's activity feed
 * picks it up. Failures are caught + logged + returned, never thrown.
 */

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createFolderAction(input: {
  name: string
  description?: string
}): Promise<FolderActionResult> {
  const user = await requireAdminAuth()

  const parsed = folderInputSchema.safeParse({
    name: input.name,
    description: input.description ?? '',
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Données invalides',
      fieldErrors: flattenErrors(parsed.error.issues),
    }
  }

  const collision = await getMediaFolderBySlug(parsed.data.slug)
  if (collision !== null) {
    return {
      ok: false,
      fieldErrors: { name: 'Un dossier portant un nom équivalent existe déjà.' },
    }
  }

  let folder
  try {
    folder = await createMediaFolder({ ...parsed.data, createdBy: user.id })
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: { action: 'media.folder.created', id: folder.id, slug: folder.slug },
    })
  } catch (error) {
    logger.error('[media] createFolderAction failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { ok: false, error: GENERIC_ERROR }
  }

  revalidatePath('/admin/media')
  return { ok: true, id: folder.id, slug: folder.slug }
}

// ---------------------------------------------------------------------------
// Update (rename + description)
// ---------------------------------------------------------------------------

export async function updateFolderAction(
  id: string,
  input: { name: string; description?: string },
): Promise<FolderActionResult> {
  const user = await requireAdminAuth()

  const existing = await getMediaFolderById(id)
  if (existing === null) {
    return { ok: false, error: "Ce dossier n'existe plus." }
  }

  const parsed = folderInputSchema.safeParse({
    name: input.name,
    description: input.description ?? '',
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Données invalides',
      fieldErrors: flattenErrors(parsed.error.issues),
    }
  }

  // Slug collision: another folder owns the new slug.
  const slugOwner = await getMediaFolderBySlug(parsed.data.slug)
  if (slugOwner !== null && slugOwner.id !== id) {
    return {
      ok: false,
      fieldErrors: { name: 'Un dossier portant un nom équivalent existe déjà.' },
    }
  }

  let updated
  try {
    updated = await updateMediaFolder(id, parsed.data)
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: { action: 'media.folder.updated', id, slug: updated.slug },
    })
  } catch (error) {
    logger.error('[media] updateFolderAction failed', {
      id,
      error: error instanceof Error ? error.message : String(error),
    })
    return { ok: false, error: GENERIC_ERROR }
  }

  revalidatePath('/admin/media')
  return { ok: true, id: updated.id, slug: updated.slug }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteFolderAction(id: string): Promise<FolderActionResult> {
  const user = await requireAdminAuth()

  let deleted
  try {
    deleted = await deleteMediaFolder(id)
  } catch (error) {
    logger.error('[media] deleteFolderAction failed', {
      id,
      error: error instanceof Error ? error.message : String(error),
    })
    return { ok: false, error: GENERIC_ERROR }
  }

  if (deleted !== null) {
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: { action: 'media.folder.deleted', id, slug: deleted.slug },
    })
  }

  revalidatePath('/admin/media')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Move asset
// ---------------------------------------------------------------------------

export async function moveAssetToFolderAction(
  assetId: string,
  folderId: string | null,
): Promise<FolderActionResult> {
  const user = await requireAdminAuth()

  if (folderId !== null) {
    const folder = await getMediaFolderById(folderId)
    if (folder === null) {
      return { ok: false, error: "Le dossier de destination n'existe plus." }
    }
  }

  try {
    await moveAssetToFolder(assetId, folderId)
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: { action: 'media.asset.moved', id: assetId, folderId },
    })
  } catch (error) {
    logger.error('[media] moveAssetToFolderAction failed', {
      assetId,
      folderId,
      error: error instanceof Error ? error.message : String(error),
    })
    return { ok: false, error: GENERIC_ERROR }
  }

  revalidatePath('/admin/media')
  revalidatePath(`/admin/media/${assetId}`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function flattenErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && out[key] === undefined) {
      out[key] = issue.message
    }
  }
  return out
}
