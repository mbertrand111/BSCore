import 'server-only'
import type React from 'react'
import { listMediaAssets } from '@/modules/media/data/repository'
import {
  blocksFromLegacyContent,
  type Block,
  type GalleryBlock,
  type HeroBlock,
} from '../../domain/blocks'
import { CtaPreview } from './previews/CtaPreview'
import { GalleryPreview, type GalleryItem } from './previews/GalleryPreview'
import { HeroPreview } from './previews/HeroPreview'
import { TextPreview } from './previews/TextPreview'

/**
 * Server Component that renders an array of blocks for a public CMS page.
 *
 * Fetches every media asset referenced by Hero / Gallery blocks in a
 * single trip (one DB query for the full library, then in-memory map
 * lookup) — avoids N+1 fetches even with multiple Gallery blocks.
 *
 * Fallback strategy: when `blocks` is empty but `fallbackContent` is
 * not, render a single Text block synthesized from the legacy content
 * field. Same code path as the editor's soft-migration logic so what
 * the user sees in the admin matches what visitors see.
 */
export interface BlockRendererProps {
  blocks: ReadonlyArray<Block>
  /** Legacy `cms_pages.content` for the fallback branch. */
  fallbackContent: string
}

export async function BlockRenderer({
  blocks,
  fallbackContent,
}: BlockRendererProps): Promise<React.JSX.Element> {
  const effectiveBlocks: ReadonlyArray<Block> =
    blocks.length > 0 ? blocks : blocksFromLegacyContent(fallbackContent)

  if (effectiveBlocks.length === 0) {
    return (
      <p className="text-sm italic text-muted-fg">
        Cette page n&apos;a pas encore de contenu.
      </p>
    )
  }

  // Resolve all referenced media in one shot. We fetch the full library
  // because the V1 catalog stays small and the alternative (a `WHERE id IN
  // (...)` query) requires a more elaborate repository helper. When the
  // library outgrows this, swap for a `getMediaAssetsByIds(ids)` call.
  const referencedIds = collectMediaIds(effectiveBlocks)
  const mediaUrls = new Map<string, string>()
  const mediaAlt = new Map<string, string>()
  if (referencedIds.size > 0) {
    const all = await listMediaAssets()
    for (const a of all) {
      if (referencedIds.has(a.id)) {
        mediaUrls.set(a.id, a.publicUrl)
        mediaAlt.set(a.id, a.altText)
      }
    }
  }

  return (
    <div className="space-y-12">
      {effectiveBlocks.map((block) => (
        <BlockSection key={block.id} block={block} mediaUrls={mediaUrls} mediaAlt={mediaAlt} />
      ))}
    </div>
  )
}

function collectMediaIds(blocks: ReadonlyArray<Block>): Set<string> {
  const ids = new Set<string>()
  for (const b of blocks) {
    if (b.type === 'hero') {
      const hero = b as HeroBlock
      if (hero.mediaId !== undefined) ids.add(hero.mediaId)
    } else if (b.type === 'gallery') {
      const gallery = b as GalleryBlock
      for (const id of gallery.mediaIds) ids.add(id)
    }
  }
  return ids
}

function BlockSection({
  block,
  mediaUrls,
  mediaAlt,
}: {
  block: Block
  mediaUrls: ReadonlyMap<string, string>
  mediaAlt: ReadonlyMap<string, string>
}): React.JSX.Element {
  switch (block.type) {
    case 'hero': {
      const imageUrl = block.mediaId !== undefined ? mediaUrls.get(block.mediaId) : undefined
      return (
        <HeroPreview
          title={block.title}
          {...(block.subtitle !== undefined ? { subtitle: block.subtitle } : {})}
          {...(imageUrl !== undefined ? { imageUrl } : {})}
        />
      )
    }
    case 'text':
      return <TextPreview body={block.body} />
    case 'gallery': {
      const items: GalleryItem[] = block.mediaIds.map((id) => ({
        id,
        url: mediaUrls.get(id) ?? '',
        alt: mediaAlt.get(id) ?? '',
      }))
      return (
        <GalleryPreview
          {...(block.title !== undefined ? { title: block.title } : {})}
          items={items}
        />
      )
    }
    case 'cta':
      return (
        <CtaPreview
          title={block.title}
          {...(block.text !== undefined ? { text: block.text } : {})}
          ctaLabel={block.ctaLabel}
          ctaHref={block.ctaHref}
        />
      )
  }
}
