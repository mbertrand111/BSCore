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
  .max(500, 'Le texte alternatif ne peut pas dépasser 500 caractères.')

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
    .min(1, 'Le nom de fichier est requis.')
    .max(255, 'Le nom de fichier ne peut pas dépasser 255 caractères.'),
  type: z
    .string()
    .refine((v) => ALLOWED_MIME_TYPES.includes(v), {
      message: `Type de fichier non supporté. Formats acceptés : ${ALLOWED_MIME_TYPES.join(', ')}.`,
    }),
  size: z
    .number()
    .int('La taille du fichier doit être un entier.')
    .positive('Le fichier semble vide.')
    .max(MAX_SIZE_BYTES, `Le fichier dépasse la taille maximale de ${formatMb(MAX_SIZE_BYTES)}.`),
})

export type FileMetadata = z.infer<typeof fileMetadataSchema>

function formatMb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}
