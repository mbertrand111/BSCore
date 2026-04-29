import { z } from 'zod'
import { ALLOWED_MIME_TYPES, MAX_SIZE_BYTES } from '../constants'

/**
 * Zod schemas for media module inputs.
 *
 * The actual `File` object (from FormData) cannot be validated by Zod
 * directly — we extract its properties (`type`, `size`, `name`) and feed
 * them through `fileMetadataSchema`. The Server Action then handles the
 * binary contents separately.
 */

export const altTextSchema = z
  .string()
  .trim()
  .max(500, 'Alt text must be 500 characters or fewer')

export const updateAltTextSchema = z.object({
  altText: altTextSchema,
})

/**
 * Validates the metadata of an uploaded file. Used in the upload action
 * after extracting the File from FormData.
 *
 * Errors are framed for the end user — they appear inline next to the
 * file picker.
 */
export const fileMetadataSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'File name is required')
    .max(255, 'File name must be 255 characters or fewer'),
  type: z
    .string()
    .refine((v) => ALLOWED_MIME_TYPES.includes(v), {
      message: `File type is not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}.`,
    }),
  size: z
    .number()
    .int('File size must be an integer')
    .positive('File appears to be empty')
    .max(MAX_SIZE_BYTES, `File exceeds the ${formatMb(MAX_SIZE_BYTES)} maximum`),
})

export type FileMetadata = z.infer<typeof fileMetadataSchema>

function formatMb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}
