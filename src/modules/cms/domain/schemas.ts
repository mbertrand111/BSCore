import { z } from 'zod'
import {
  MAX_CONTENT_LENGTH,
  MAX_EXCERPT_LENGTH,
  MAX_SLUG_LENGTH,
  MAX_TITLE_LENGTH,
  STATUS_VALUES,
} from '../constants'
import { isReservedSlug, isValidSlugFormat, normalizeSlug } from './slug'

/**
 * Single Zod schema for the CMS page form input.
 *
 * Output is the validated, normalized shape passed to the repository.
 * The slug is lower-cased and trimmed; the optional UUID for the main
 * media is coerced from empty-string to `null`.
 */

const slugField = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(MAX_SLUG_LENGTH, `Slug must be ${MAX_SLUG_LENGTH} characters or fewer`)
  .transform((v) => normalizeSlug(v))
  .refine(
    (v) => isValidSlugFormat(v),
    'Slug must be lowercase letters, digits, or hyphens (no leading/trailing hyphen).',
  )
  .refine((v) => !isReservedSlug(v), 'This slug is reserved by the platform.')

const optionalUuid = z
  .string()
  .trim()
  .refine(
    (v) =>
      v === '' ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
    'Must be a valid UUID',
  )
  .transform((v) => (v === '' ? null : v))
  .nullable()

export const cmsPageInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`),

  slug: slugField,

  excerpt: z
    .string()
    .trim()
    .max(MAX_EXCERPT_LENGTH, `Excerpt must be ${MAX_EXCERPT_LENGTH} characters or fewer`)
    .transform((v) => (v === '' ? null : v))
    .nullable(),

  content: z
    .string()
    .min(1, 'Content is required')
    .max(MAX_CONTENT_LENGTH, `Content must be ${MAX_CONTENT_LENGTH} characters or fewer`),

  status: z.enum(STATUS_VALUES),

  mainMediaAssetId: optionalUuid,
})

export type CmsPageInput = z.infer<typeof cmsPageInputSchema>
