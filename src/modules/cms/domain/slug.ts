import { RESERVED_SLUGS } from '../constants'

/**
 * Slug helpers — pure functions, server- and client-safe.
 *
 * The slug is the canonical identifier of a CMS page in the public URL.
 * It must be:
 *   - lowercase ASCII letters, digits, hyphens
 *   - 1-100 characters
 *   - not start or end with a hyphen
 *   - not match any reserved platform / module route
 */

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

/**
 * Lower-cases and trims a slug for storage and lookup.
 * Idempotent.
 */
export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * True when the (already lower-cased) slug matches the format rules.
 * Use AFTER `normalizeSlug` for consistent results.
 */
export function isValidSlugFormat(slug: string): boolean {
  if (slug.length === 0 || slug.length > 100) return false
  return SLUG_REGEX.test(slug)
}

/**
 * True when the slug shadows a platform route or another module's top-level path.
 * The check is case-insensitive — `normalizeSlug` is applied first internally.
 */
export function isReservedSlug(slug: string): boolean {
  const normalized = normalizeSlug(slug)
  return RESERVED_SLUGS.includes(normalized)
}
