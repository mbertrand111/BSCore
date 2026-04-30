import { z } from 'zod'

/**
 * Typed content blocks for CMS pages.
 *
 * Storage: each page stores its blocks as a JSONB array in `cms_pages.blocks`
 * (see migration 0009). Each block is a discriminated-union member identified
 * by its `type` field. The shapes here are the SOURCE OF TRUTH — the Zod
 * schemas below mirror them and the runtime parses go through Zod, never
 * through ad-hoc casts.
 *
 * Adding a new block type:
 *   1. Add the type to the `Block` union below.
 *   2. Add a Zod schema for it.
 *   3. Add it to `blockSchema` discriminated union.
 *   4. Add a default factory in `defaultBlock(type)`.
 *   5. Build a `<{Type}BlockEditor>` and wire it in `BlockCard`.
 *   6. Build a `<{Type}Preview>` shared between admin and public renderers.
 *
 * The `version` field on each block is reserved for forward compat (v2
 * shape changes) — V1 = 1 always.
 */

// ---------------------------------------------------------------------------
// Constraints — one place per limit so the editor and the Zod parser agree
// ---------------------------------------------------------------------------

export const HERO_TITLE_MAX = 140
export const HERO_SUBTITLE_MAX = 280
export const TEXT_BODY_MAX = 10_000
export const GALLERY_TITLE_MAX = 140
export const GALLERY_MAX_IMAGES = 60
export const CTA_TITLE_MAX = 140
export const CTA_TEXT_MAX = 500
export const CTA_LABEL_MAX = 60
export const CTA_HREF_MAX = 1000

const BLOCK_VERSION = 1 as const

// ---------------------------------------------------------------------------
// Types — the public Block union exported for consumers
// ---------------------------------------------------------------------------

export type BlockType = 'hero' | 'text' | 'gallery' | 'cta'

export interface HeroBlock {
  readonly id: string
  readonly type: 'hero'
  readonly version: typeof BLOCK_VERSION
  readonly title: string
  readonly subtitle?: string
  readonly mediaId?: string
}

export interface TextBlock {
  readonly id: string
  readonly type: 'text'
  readonly version: typeof BLOCK_VERSION
  readonly body: string
}

export interface GalleryBlock {
  readonly id: string
  readonly type: 'gallery'
  readonly version: typeof BLOCK_VERSION
  readonly title?: string
  readonly mediaIds: ReadonlyArray<string>
}

export interface CtaBlock {
  readonly id: string
  readonly type: 'cta'
  readonly version: typeof BLOCK_VERSION
  readonly title: string
  readonly text?: string
  readonly ctaLabel: string
  readonly ctaHref: string
}

export type Block = HeroBlock | TextBlock | GalleryBlock | CtaBlock

// ---------------------------------------------------------------------------
// Zod schemas — one per type, then a discriminated union
// ---------------------------------------------------------------------------

const idSchema = z
  .string()
  .uuid('Identifiant de bloc invalide.')

const versionSchema = z.literal(BLOCK_VERSION)

const optionalString = (max: number, label: string): z.ZodOptional<z.ZodString> =>
  z
    .string()
    .trim()
    .max(max, `${label} ne peut pas dépasser ${max} caractères.`)
    .optional()

const heroSchema = z.object({
  id: idSchema,
  type: z.literal('hero'),
  version: versionSchema,
  title: z
    .string()
    .trim()
    .min(1, 'Le titre du bloc Hero est requis.')
    .max(HERO_TITLE_MAX, `Le titre ne peut pas dépasser ${HERO_TITLE_MAX} caractères.`),
  subtitle: optionalString(HERO_SUBTITLE_MAX, 'Le sous-titre'),
  mediaId: z.string().uuid('Identifiant média invalide.').optional(),
})

const textSchema = z.object({
  id: idSchema,
  type: z.literal('text'),
  version: versionSchema,
  body: z
    .string()
    .min(1, 'Le bloc Texte ne peut pas être vide.')
    .max(TEXT_BODY_MAX, `Le bloc Texte ne peut pas dépasser ${TEXT_BODY_MAX} caractères.`),
})

const gallerySchema = z.object({
  id: idSchema,
  type: z.literal('gallery'),
  version: versionSchema,
  title: optionalString(GALLERY_TITLE_MAX, 'Le titre de la galerie'),
  mediaIds: z
    .array(z.string().uuid('Identifiant média invalide.'))
    .min(1, 'Une galerie doit contenir au moins une image.')
    .max(GALLERY_MAX_IMAGES, `Une galerie ne peut pas dépasser ${GALLERY_MAX_IMAGES} images.`),
})

const ctaSchema = z.object({
  id: idSchema,
  type: z.literal('cta'),
  version: versionSchema,
  title: z
    .string()
    .trim()
    .min(1, "Le titre de l'appel à l'action est requis.")
    .max(CTA_TITLE_MAX, `Le titre ne peut pas dépasser ${CTA_TITLE_MAX} caractères.`),
  text: optionalString(CTA_TEXT_MAX, 'Le texte'),
  ctaLabel: z
    .string()
    .trim()
    .min(1, 'Le libellé du bouton est requis.')
    .max(CTA_LABEL_MAX, `Le libellé ne peut pas dépasser ${CTA_LABEL_MAX} caractères.`),
  ctaHref: z
    .string()
    .trim()
    .min(1, 'Le lien du bouton est requis.')
    .max(CTA_HREF_MAX, `Le lien ne peut pas dépasser ${CTA_HREF_MAX} caractères.`)
    .refine(
      (v) => /^(https?:)?\/\//.test(v) || v.startsWith('/') || v.startsWith('#'),
      'Le lien doit commencer par https://, par / ou par #.',
    ),
})

export const blockSchema = z.discriminatedUnion('type', [
  heroSchema,
  textSchema,
  gallerySchema,
  ctaSchema,
])

export const blocksSchema = z.array(blockSchema).max(
  100,
  'Une page ne peut pas contenir plus de 100 blocs.',
)

// ---------------------------------------------------------------------------
// Factories — used by the editor to create blocks with sensible defaults
// ---------------------------------------------------------------------------

function newId(): string {
  // crypto.randomUUID is available in Node 19+ and modern browsers (server &
  // client). The CmsPageForm runs as a Client Component, so this resolves to
  // the browser API on the create path, and to Node's on the seed-side path.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Last-ditch fallback for very old environments — collision risk acceptable
  // because IDs are scoped to a single page's blocks array, never global.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function defaultBlock(type: BlockType): Block {
  switch (type) {
    case 'hero':
      return { id: newId(), type: 'hero', version: BLOCK_VERSION, title: '' }
    case 'text':
      return { id: newId(), type: 'text', version: BLOCK_VERSION, body: '' }
    case 'gallery':
      return { id: newId(), type: 'gallery', version: BLOCK_VERSION, mediaIds: [] }
    case 'cta':
      return {
        id: newId(),
        type: 'cta',
        version: BLOCK_VERSION,
        title: '',
        ctaLabel: 'En savoir plus',
        ctaHref: '/',
      }
  }
}

/**
 * Synthesize a single Text block from a legacy `content` field. Used when a
 * page has empty `blocks` but non-empty `content` — the editor opens with
 * one block populated from the existing text so the user doesn't see an
 * empty editor on a page that already has content.
 */
export function blocksFromLegacyContent(content: string): Block[] {
  if (content.trim() === '') return []
  return [
    { id: newId(), type: 'text', version: BLOCK_VERSION, body: content },
  ]
}

/**
 * Concatenate Text blocks back into a single content string. Kept as a
 * fallback / search index value in `cms_pages.content`. Non-text blocks
 * are ignored — they have no plain-text projection in V1.
 */
export function deriveContentFromBlocks(blocks: ReadonlyArray<Block>): string {
  return blocks
    .filter((b): b is TextBlock => b.type === 'text')
    .map((b) => b.body)
    .join('\n\n')
}

/**
 * UI metadata per block type — labels, icons (lucide names), descriptions.
 * Kept here so the AddBlockMenu, BlockCard header, and any future palette
 * UI all read from one place.
 */
export const BLOCK_TYPE_META: Record<
  BlockType,
  { label: string; iconName: string; description: string }
> = {
  hero: {
    label: 'Hero',
    iconName: 'image',
    description: 'Bandeau en haut de page avec titre fort + sous-titre.',
  },
  text: {
    label: 'Texte',
    iconName: 'align-left',
    description: 'Paragraphes — récit, présentation, description.',
  },
  gallery: {
    label: 'Galerie',
    iconName: 'layout-grid',
    description: 'Grille d’images avec optionnellement un titre.',
  },
  cta: {
    label: "Appel à l'action",
    iconName: 'megaphone',
    description: 'Carte de mise en avant avec un bouton (réserver, contacter…).',
  },
}
