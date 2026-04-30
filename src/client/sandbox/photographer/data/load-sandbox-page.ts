import 'server-only'

import { cache } from 'react'
import {
  getPublishedCmsPageBySlug,
  type Block,
  type CmsPage,
  type GalleryBlock,
  type HeroBlock,
  type TextBlock,
} from '@/modules/cms'
import { getMediaAssetById, getMediaPublicUrl } from '@/modules/media'
import {
  photographerCmsSlugByRoute,
  type PhotographerCmsRoute,
} from '../content/site-content'

/**
 * Server-side helper used by every photographer sandbox page (server
 * components) to fetch its CMS page + resolve its main media in one call.
 *
 * Returns `null` when:
 *   - no CMS slug is mapped for this route
 *   - the CMS page doesn't exist (or is in draft → published-only)
 *
 * The shape returned is normalized for sandbox consumers: the page itself,
 * the resolved main image (URL + alt) when present, and helper accessors
 * for the most-used block patterns (first hero / first gallery / all text
 * blocks). Specific components decide what to use.
 *
 * Why a sandbox-specific helper rather than reusing the public route logic:
 * the photographer pages don't render a generic block tree — they compose
 * heavily-styled sections (hero with serif italic title, about with drop
 * cap, etc.) and only need bits of the CMS page. This helper trims the
 * ceremony around fetch + resolve so each route file stays under 30 lines.
 */
export interface SandboxPageBundle {
  readonly page: CmsPage
  /** Resolved public URL of the page's mainMediaAsset, or null. */
  readonly mainImageUrl: string | null
  /** Alt text of the main asset (falls back to filename). */
  readonly mainImageAlt: string
  /** First Hero block in the page's blocks, or null. */
  readonly heroBlock: HeroBlock | null
  /**
   * URL resolved from the hero block's mediaId, when present. Falls back
   * to mainImageUrl so a Hero with no explicit image still gets a visual.
   */
  readonly heroImageUrl: string | null
  /** First Gallery block, or null. */
  readonly galleryBlock: GalleryBlock | null
  /**
   * URLs + alt for every image referenced by the gallery block — resolved
   * in batch so the consumer doesn't iterate.
   */
  readonly galleryItems: ReadonlyArray<{ id: string; url: string; alt: string }>
  /** All Text blocks, in order — useful for AboutBody-style pages. */
  readonly textBlocks: ReadonlyArray<TextBlock>
}

/**
 * Wrapped in React.cache so a single request that calls the loader twice
 * (once from generateMetadata, once from the default export of the same
 * route) only hits the DB once — both calls share the resolved bundle.
 */
export const loadSandboxPage = cache(
  async (route: PhotographerCmsRoute): Promise<SandboxPageBundle | null> => {
  const slug = photographerCmsSlugByRoute[route]
  const page = await getPublishedCmsPageBySlug(slug)
  if (page === null) return null

  // Main image (page-level) ------------------------------------------------
  let mainImageUrl: string | null = null
  let mainImageAlt = ''
  if (page.mainMediaAssetId !== null) {
    const asset = await getMediaAssetById(page.mainMediaAssetId)
    if (asset !== null) {
      mainImageUrl = getMediaPublicUrl(asset)
      mainImageAlt = asset.altText || asset.originalFilename
    }
  }

  // Hero / Gallery / Text blocks -------------------------------------------
  const blocks: ReadonlyArray<Block> = page.blocks
  const heroBlock = (blocks.find((b): b is HeroBlock => b.type === 'hero') ?? null)
  const galleryBlock =
    (blocks.find((b): b is GalleryBlock => b.type === 'gallery') ?? null)
  const textBlocks = blocks.filter((b): b is TextBlock => b.type === 'text')

  // Resolve hero image (block-level) --------------------------------------
  let heroImageUrl = mainImageUrl
  if (heroBlock?.mediaId !== undefined) {
    const asset = await getMediaAssetById(heroBlock.mediaId)
    if (asset !== null) heroImageUrl = getMediaPublicUrl(asset)
  }

  // Resolve gallery items (block-level) -----------------------------------
  let galleryItems: ReadonlyArray<{ id: string; url: string; alt: string }> = []
  if (galleryBlock !== null && galleryBlock.mediaIds.length > 0) {
    const resolved = await Promise.all(
      galleryBlock.mediaIds.map(async (id) => {
        const asset = await getMediaAssetById(id)
        if (asset === null) return null
        return {
          id: asset.id,
          url: getMediaPublicUrl(asset),
          alt: asset.altText || asset.originalFilename,
        }
      }),
    )
    galleryItems = resolved.filter(
      (x): x is { id: string; url: string; alt: string } => x !== null,
    )
  }

  return {
    page,
    mainImageUrl,
    mainImageAlt,
    heroBlock,
    heroImageUrl,
    galleryBlock,
    galleryItems,
    textBlocks,
  }
  },
)
