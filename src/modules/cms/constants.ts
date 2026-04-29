/**
 * CMS module constants — V1.
 *
 * Reserved slug list mirrors the platform's owned URL namespace plus the
 * other module routes. Mirroring matters: a CMS page cannot shadow
 * `/admin`, `/api`, `/dev`, `/login`, or any future module's top-level
 * route. The Zod validator and the public route both read this list.
 */

export const MAX_TITLE_LENGTH = 200
export const MAX_SLUG_LENGTH = 100
export const MAX_EXCERPT_LENGTH = 500
export const MAX_CONTENT_LENGTH = 50_000

export const STATUS_VALUES = ['draft', 'published'] as const
export type CmsStatus = (typeof STATUS_VALUES)[number]

/**
 * Slugs a CMS page MUST NOT use — they collide with platform routes,
 * Next.js conventions, or other module top-level paths.
 *
 * Comparison is case-insensitive (the validator lowercases first).
 */
export const RESERVED_SLUGS: ReadonlyArray<string> = [
  // Platform / Next.js
  'admin',
  'api',
  'dev',
  'login',
  '_next',
  '_app',
  '_error',
  '_document',
  'static',
  'public',
  'assets',
  // Metadata routes (file-based)
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'manifest.webmanifest',
  // Other module top-level routes (whether enabled or not)
  'media',
  'seo',
  'blog',
  'cms',
  'forms',
]
