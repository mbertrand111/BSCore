'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/socle-plus/admin'
import { writeAuditEvent, AUDIT_EVENTS } from '@/socle-plus/audit'
import { logger } from '@/socle/logger'
import { createSeoEntry, getSeoEntryByRoute, updateSeoEntry } from '../data/repository'
import { seoEntryInputSchema } from '../domain/schemas'
import type { SeoFormState } from './state'

const PARSE_FAILURE_MSG = 'Some fields are invalid. Please correct the highlighted entries.'

function readFormString(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === 'string' ? v : ''
}

function readFormBool(formData: FormData, key: string): boolean {
  // Native HTML form: checkbox sends 'on' when checked, nothing when unchecked.
  return formData.get(key) === 'on'
}

function readFormPayload(formData: FormData): Record<string, unknown> {
  return {
    route: readFormString(formData, 'route'),
    title: readFormString(formData, 'title'),
    description: readFormString(formData, 'description'),
    canonicalUrl: readFormString(formData, 'canonicalUrl'),
    robotsIndex: readFormBool(formData, 'robotsIndex'),
    robotsFollow: readFormBool(formData, 'robotsFollow'),
    ogTitle: readFormString(formData, 'ogTitle'),
    ogDescription: readFormString(formData, 'ogDescription'),
    ogImageUrl: readFormString(formData, 'ogImageUrl'),
    twitterTitle: readFormString(formData, 'twitterTitle'),
    twitterDescription: readFormString(formData, 'twitterDescription'),
    twitterImageUrl: readFormString(formData, 'twitterImageUrl'),
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

/**
 * Create a new SEO entry. Returns updated form state on validation failure;
 * redirects to /admin/seo on success.
 */
export async function createSeoEntryAction(
  _prev: SeoFormState,
  formData: FormData,
): Promise<SeoFormState> {
  const user = await requireAdminAuth()
  const payload = readFormPayload(formData)
  const parsed = seoEntryInputSchema.safeParse(payload)

  if (!parsed.success) {
    return { error: PARSE_FAILURE_MSG, fieldErrors: flattenZodErrors(parsed.error), values: payload }
  }

  // Reject duplicate routes upfront — gives a clearer error than a unique-constraint failure.
  const existing = await getSeoEntryByRoute(parsed.data.route)
  if (existing !== null) {
    return {
      error: null,
      fieldErrors: { route: 'A SEO entry already exists for this route.' },
      values: payload,
    }
  }

  try {
    const created = await createSeoEntry(parsed.data)
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: { action: 'seo.entry.created', route: created.route, id: created.id },
    })
  } catch (error) {
    logger.error('[seo] createSeoEntryAction failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: 'Could not save the entry. Please try again.', values: payload }
  }

  revalidatePath('/admin/seo')
  redirect('/admin/seo')
}

/**
 * Update an existing SEO entry. Returns form state on validation failure;
 * redirects to /admin/seo on success.
 */
export async function updateSeoEntryAction(
  id: string,
  _prev: SeoFormState,
  formData: FormData,
): Promise<SeoFormState> {
  const user = await requireAdminAuth()
  const payload = readFormPayload(formData)
  const parsed = seoEntryInputSchema.safeParse(payload)

  if (!parsed.success) {
    return { error: PARSE_FAILURE_MSG, fieldErrors: flattenZodErrors(parsed.error), values: payload }
  }

  // If the route changed, ensure we're not colliding with another entry.
  const existing = await getSeoEntryByRoute(parsed.data.route)
  if (existing !== null && existing.id !== id) {
    return {
      error: null,
      fieldErrors: { route: 'Another SEO entry already uses this route.' },
      values: payload,
    }
  }

  try {
    await updateSeoEntry(id, parsed.data)
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, {
      actorId: user.id,
      meta: { action: 'seo.entry.updated', route: parsed.data.route, id },
    })
  } catch (error) {
    logger.error('[seo] updateSeoEntryAction failed', {
      id,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: 'Could not save the entry. Please try again.', values: payload }
  }

  revalidatePath('/admin/seo')
  revalidatePath(`/admin/seo/${id}`)
  redirect('/admin/seo')
}
