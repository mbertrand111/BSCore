/**
 * Folder slug helpers — pure functions, server- and client-safe.
 *
 * Folder slugs identify a folder for future deep-link routes
 * (`/admin/media?folder=portraits-2026`). They are auto-generated from
 * the human name on create — the user never types them — but stored
 * separately so a rename never breaks an existing link until the user
 * explicitly refreshes the slug.
 *
 * Rules:
 *   - lowercase ASCII letters, digits, hyphens
 *   - 1-140 chars (slightly longer than CMS slugs to accommodate
 *     descriptive folder names like "Portraits-couples-2026-printemps")
 *   - no leading / trailing hyphen
 */

const FOLDER_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

/**
 * Convert a free-form name into a folder slug. Removes diacritics
 * (é → e, ç → c…), collapses non-alphanum runs to a single hyphen,
 * trims leading/trailing hyphens, lowercases.
 */
export function slugifyFolderName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140)
}

export function isValidFolderSlug(slug: string): boolean {
  if (slug.length === 0 || slug.length > 140) return false
  return FOLDER_SLUG_REGEX.test(slug)
}
