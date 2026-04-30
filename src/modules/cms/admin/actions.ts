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
import { cmsPageInputSchema, type CmsPageInput } from '../domain/schemas'
import { NO_MEDIA_SENTINEL } from '../constants'
import type { CmsFormState } from './state'

const GENERIC_ERROR = "Impossible d'enregistrer la page. Veuillez réessayer."
const PARSE_FAILURE_MSG =
  'Certains champs sont invalides. Veuillez corriger les entrées surlignées.'
const SLUG_TAKEN_MSG = 'Cet identifiant URL est déjà utilisé par une autre page.'
const PAGE_GONE_MSG = "Cette page n'existe plus."

function readPayload(formData: FormData): Record<string, unknown> {
  const get = (key: string): string => {
    const v = formData.get(key)
    return typeof v === 'string' ? v : ''
  }
  // The form posts NO_MEDIA_SENTINEL when the user picks "No image" because
  // Radix Select forbids empty-string item values. Translate it back to ''
  // here so the schema can coerce it to null like a normal optional field.
  const rawMedia = get('mainMediaAssetId')
  const mainMediaAssetId = rawMedia === NO_MEDIA_SENTINEL ? '' : rawMedia
  // The header buttons signal their intent via a hidden _intent value:
  //   - 'publish'   → force status='published' (the "Publier" button)
  //   - 'unpublish' → force status='draft' (the "Passer en brouillon" button)
  //   - 'save' (default) → use whatever the Status select holds (lets the
  //                        user also flip the toggle from the Réglages tab)
  const intent = get('_intent')
  const rawStatus = get('status')
  const status =
    intent === 'publish'
      ? 'published'
      : intent === 'unpublish'
        ? 'draft'
        : rawStatus
  // Blocks come in as a JSON string in a hidden field. Parse here; the Zod
  // schema (blocksSchema) does the structural validation downstream. A
  // missing or unparseable field is normalized to an empty array so the
  // page degrades gracefully to "no blocks" instead of refusing the save.
  const rawBlocks = get('blocks')
  let blocks: unknown = []
  if (rawBlocks !== '') {
    try {
      blocks = JSON.parse(rawBlocks)
    } catch {
      blocks = []
    }
  }
  return {
    title: get('title'),
    slug: get('slug'),
    excerpt: get('excerpt'),
    content: get('content'),
    status,
    mainMediaAssetId,
    blocks,
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
      fieldErrors: { slug: SLUG_TAKEN_MSG },
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
    return { error: PAGE_GONE_MSG, values: payload }
  }

  // Slug collision: another page already owns the new slug.
  const slugOwner = await getCmsPageBySlug(parsed.data.slug)
  if (slugOwner !== null && slugOwner.id !== id) {
    return {
      error: null,
      fieldErrors: { slug: SLUG_TAKEN_MSG },
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
// Status toggle (Publier / Passer en brouillon)
// ---------------------------------------------------------------------------
//
// These two actions are called directly from a Client Component (via
// useTransition) when the user clicks the row 3-dot menu's Publier / Passer
// en brouillon item. They DON'T redirect — the caller does router.refresh()
// so the list updates inline without navigating away.
//
// The full updateCmsPageAction can do the same job via the form's
// _intent=publish|unpublish marker, but it requires a full form submit and
// always redirects. These helpers are the one-click variant.
//
// Both update only `status` (and `publishedAt` on first publication) — the
// rest of the page is untouched.

export interface CmsStatusActionResult {
  readonly ok: boolean
  readonly error?: string
}

export async function publishCmsPageAction(id: string): Promise<CmsStatusActionResult> {
  return setStatus(id, 'published')
}

export async function unpublishCmsPageAction(id: string): Promise<CmsStatusActionResult> {
  return setStatus(id, 'draft')
}

async function setStatus(
  id: string,
  status: 'draft' | 'published',
): Promise<CmsStatusActionResult> {
  const user = await requireAdminAuth()

  const existing = await getCmsPageById(id)
  if (existing === null) {
    return { ok: false, error: PAGE_GONE_MSG }
  }
  if (existing.status === status) {
    // No-op — the page is already in the requested state. Treat as success
    // so the UI updates without spurious error toast.
    return { ok: true }
  }

  let updated
  try {
    // Reuse updateCmsPage with the existing input shape — only the status
    // field actually changes; everything else round-trips unchanged. The
    // blocks cast bridges `Block[]` (with readonly nested arrays) to the
    // Zod-inferred input type which uses mutable arrays.
    updated = await updateCmsPage(
      id,
      {
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt,
        content: existing.content,
        blocks: existing.blocks as unknown as CmsPageInput['blocks'],
        status,
        mainMediaAssetId: existing.mainMediaAssetId,
      },
      existing.status,
    )

    // Audit: dedicated event so the dashboard activity feed reads cleanly.
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: {
        action: status === 'published' ? 'cms.page.published' : 'cms.page.unpublished',
        id,
        slug: updated.slug,
      },
    })
  } catch (error) {
    logger.error('[cms] setStatus failed', {
      id,
      target: status,
      error: error instanceof Error ? error.message : String(error),
    })
    return { ok: false, error: GENERIC_ERROR }
  }

  revalidatePath('/admin/cms')
  revalidatePath(`/admin/cms/${id}`)
  if (existing.slug !== updated.slug) revalidatePath(`/${existing.slug}`)
  revalidatePath(`/${updated.slug}`)
  return { ok: true }
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
