import { z } from 'zod'
import { isForbiddenSeoRoute, normalizeRoute } from './normalize'

/**
 * Single Zod schema covering the SEO form input.
 *
 * Output type is the validated, normalized shape that the repository
 * accepts. Empty optional strings are coerced to `null` so the DB stores
 * NULLs (not empty strings).
 */

const optionalText = z
  .string()
  .trim()
  .max(200, 'Must be 200 characters or fewer')
  .transform((v) => (v === '' ? null : v))
  .nullable()

const optionalShortText = z
  .string()
  .trim()
  .max(70, 'Must be 70 characters or fewer')
  .transform((v) => (v === '' ? null : v))
  .nullable()

const optionalImageUrlOrPath = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\//i.test(v) || v.startsWith('/'),
    'Must be an absolute URL (https://...) or a relative path starting with /',
  )
  .transform((v) => (v === '' ? null : v))
  .nullable()

const optionalAbsoluteUrl = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\//i.test(v),
    'Must be an absolute URL (https://...)',
  )
  .transform((v) => (v === '' ? null : v))
  .nullable()

export const seoEntryInputSchema = z.object({
  route: z
    .string()
    .trim()
    .min(1, 'Route is required')
    .refine((v) => v.startsWith('/'), 'Route must start with /')
    .refine((v) => !v.includes('?'), 'Route must not contain query parameters')
    .refine((v) => !isForbiddenSeoRoute(v), 'This route is reserved by the platform')
    .transform((v) => normalizeRoute(v)),

  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(70, 'Title must be 70 characters or fewer'),

  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(160, 'Description must be 160 characters or fewer'),

  canonicalUrl: optionalAbsoluteUrl,

  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),

  ogTitle: optionalShortText,
  ogDescription: optionalText,
  ogImageUrl: optionalImageUrlOrPath,

  twitterTitle: optionalShortText,
  twitterDescription: optionalText,
  twitterImageUrl: optionalImageUrlOrPath,
})

export type SeoEntryInput = z.infer<typeof seoEntryInputSchema>
