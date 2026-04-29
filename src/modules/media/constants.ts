/**
 * Media module constraints — V1 defaults.
 *
 * Kept in a single file so a project clone can override per project if
 * needed (or a future CMS-driven config can replace these constants).
 *
 * Why these values:
 *   - 10 MB covers most photography / hero images. Bigger images should
 *     be optimized before upload.
 *   - JPEG / PNG / WebP cover 95% of admin needs. SVG and PDF are
 *     deliberately excluded in V1 because:
 *       SVG → can carry inline scripts, requires server-side sanitization
 *       PDF → larger surface, separate concerns (documents, not media)
 *     Add them per project once the security review is done.
 */

export const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export const ALLOWED_MIME_TYPES: ReadonlyArray<string> = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

export const STORAGE_BUCKET = 'media'

/**
 * Mapping from MIME type to the canonical extension we use to build
 * the storage path. Only declared MIME types appear here.
 */
export const MIME_TO_EXT: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
