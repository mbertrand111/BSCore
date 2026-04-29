'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/socle-plus/admin'
import { writeAuditEvent, AUDIT_EVENTS } from '@/socle-plus/audit'
import { logger } from '@/socle/logger'
import {
  createCmsPage,
  deleteCmsPage,
  getCmsPageById,
  getCmsPageBySlug,
  updateCmsPage,
} from '../data/repository'
import { cmsPageInputSchema } from '../domain/schemas'
import type { CmsFormState } from './state'

const GENERIC_ERROR = 'Could not save the page. Please try again.'
const PARSE_FAILURE_MSG = 'Some fields are invalid. Please correct the highlighted entries.'

function readPayload(formData: FormData): Record<string, unknown> {
  const get = (key: string): string => {
    const v = formData.get(key)
    return typeof v === 'string' ? v : ''
  }
  return {
    title: get('title'),
    slug: get('slug'),
    excerpt: get('excerpt'),
    content: get('content'),
    status: get('status'),
    mainMediaAssetId: get('mainMediaAssetId'),
  }
}

function flattenZodErrors(
  zodError: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> },
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of zodError.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && out[key] === undefined) {
      out[key] = issue.message
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createCmsPageAction(
  _prev: CmsFormState,
  formData: FormData,
): Promise<CmsFormState> {
  const user = await requireAdminAuth()
  const payload = readPayload(formData)
  const parsed = cmsPageInputSchema.safeParse(payload)

  if (!parsed.success) {
    return { error: PARSE_FAILURE_MSG, fieldErrors: flattenZodErrors(parsed.error), values: payload }
  }

  // Check slug uniqueness up-front for a clear error.
  const existing = await getCmsPageBySlug(parsed.data.slug)
  if (existing !== null) {
    return {
      error: null,
      fieldErrors: { slug: 'Another page already uses this slug.' },
      values: payload,
    }
  }

  let created
  try {
    created = await createCmsPage({ ...parsed.data, createdBy: user.id })
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: {
        action: 'cms.page.created',
        id: created.id,
        slug: created.slug,
        status: created.status,
      },
    })
    if (created.status === 'published') {
      await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
        actorId: user.id,
        meta: { action: 'cms.page.published', id: created.id, slug: created.slug },
      })
    }
  } catch (error) {
    logger.error('[cms] createCmsPageAction failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: GENERIC_ERROR, values: payload }
  }

  revalidatePath('/admin/cms')
  revalidatePath(`/${created.slug}`)
  redirect('/admin/cms')
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateCmsPageAction(
  id: string,
  _prev: CmsFormState,
  formData: FormData,
): Promise<CmsFormState> {
  const user = await requireAdminAuth()
  const payload = readPayload(formData)
  const parsed = cmsPageInputSchema.safeParse(payload)

  if (!parsed.success) {
    return { error: PARSE_FAILURE_MSG, fieldErrors: flattenZodErrors(parsed.error), values: payload }
  }

  const existing = await getCmsPageById(id)
  if (existing === null) {
    return { error: 'This page no longer exists.', values: payload }
  }

  // Slug collision: another page already owns the new slug.
  const slugOwner = await getCmsPageBySlug(parsed.data.slug)
  if (slugOwner !== null && slugOwner.id !== id) {
    return {
      error: null,
      fieldErrors: { slug: 'Another page already uses this slug.' },
      values: payload,
    }
  }

  let updated
  try {
    updated = await updateCmsPage(id, parsed.data, existing.status)
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: {
        action: 'cms.page.updated',
        id,
        slug: updated.slug,
        status: updated.status,
      },
    })
    // Emit dedicated transition events for clarity in the audit log.
    if (existing.status !== 'published' && updated.status === 'published') {
      await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
        actorId: user.id,
        meta: { action: 'cms.page.published', id, slug: updated.slug },
      })
    } else if (existing.status === 'published' && updated.status !== 'published') {
      await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
        actorId: user.id,
        meta: { action: 'cms.page.unpublished', id, slug: updated.slug },
      })
    }
  } catch (error) {
    logger.error('[cms] updateCmsPageAction failed', {
      id,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: GENERIC_ERROR, values: payload }
  }

  revalidatePath('/admin/cms')
  revalidatePath(`/admin/cms/${id}`)
  // Both old and new slugs in case the slug changed.
  if (existing.slug !== updated.slug) revalidatePath(`/${existing.slug}`)
  revalidatePath(`/${updated.slug}`)
  redirect('/admin/cms')
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteCmsPageAction(id: string): Promise<void> {
  const user = await requireAdminAuth()

  let deleted
  try {
    deleted = await deleteCmsPage(id)
  } catch (error) {
    logger.error('[cms] deleteCmsPageAction failed', {
      id,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error(GENERIC_ERROR)
  }

  if (deleted !== null) {
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: { action: 'cms.page.deleted', id, slug: deleted.slug },
    })
    revalidatePath(`/${deleted.slug}`)
  }

  revalidatePath('/admin/cms')
  redirect('/admin/cms')
}
