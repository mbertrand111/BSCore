import { z } from 'zod'
import { isValidFolderSlug, slugifyFolderName } from './folder-slug'

/**
 * Validation schemas for folder CRUD.
 *
 * Slug is derived server-side from the name when the caller doesn't
 * provide one. When the caller does provide a slug (e.g. an admin power
 * user customizing the URL key), it is normalized + format-checked.
 *
 * Description is optional — empty string coerces to `null` so the DB
 * column stays clean.
 */
export const folderInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Le nom du dossier est requis.')
      .max(120, 'Le nom du dossier ne peut pas dépasser 120 caractères.'),
    slug: z
      .string()
      .trim()
      .max(140, "L'identifiant URL ne peut pas dépasser 140 caractères.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'La description ne peut pas dépasser 500 caractères.')
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .optional(),
  })
  .transform((input) => {
    const slug = input.slug !== undefined && input.slug !== '' ? input.slug : slugifyFolderName(input.name)
    return {
      name: input.name,
      slug,
      description: input.description ?? null,
    }
  })
  .refine((v) => isValidFolderSlug(v.slug), {
    path: ['slug'],
    message: "L'identifiant URL contient des caractères invalides.",
  })

export type FolderInput = z.infer<typeof folderInputSchema>
