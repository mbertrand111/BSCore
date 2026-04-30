'use client'

import type React from 'react'
import { useMemo } from 'react'
import type { Block } from '../../domain/blocks'
import { BlockCard } from './BlockCard'

export interface BlockListProps {
  blocks: ReadonlyArray<Block>
  /**
   * Map of every media id referenced anywhere in the page → its public URL.
   * Provided by the parent (CmsPageForm) which fetches the media library
   * once. The picker inside Hero / Gallery editors fetches its own data on
   * demand — this map is only for rendering thumbnails of already-picked
   * assets.
   */
  mediaUrls: ReadonlyMap<string, string>
  /** Map id → alt text (mirrors mediaUrls). */
  mediaAlt: ReadonlyMap<string, string>
  onChange: (blocks: ReadonlyArray<Block>) => void
}

/**
 * Block list editor — CMS mode.
 *
 * Clients edit the CONTENT of each existing block (text, photos…). They
 * cannot add, remove, or reorder blocks — that's the studio's
 * responsibility, set up via the seed or admin scripts. This is a CMS,
 * not a site builder: the structure is locked, only the content is open.
 */
export function BlockList({
  blocks,
  mediaUrls,
  mediaAlt,
  onChange,
}: BlockListProps): React.JSX.Element {
  const total = blocks.length

  const cards = useMemo(
    () =>
      blocks.map((block, index) => ({
        block,
        index,
        replace: (next: Block) => {
          const copy = blocks.slice()
          copy[index] = next
          onChange(copy)
        },
      })),
    [blocks, onChange],
  )

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
        Blocs · {total}
      </p>

      {total === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Cette page n&apos;a pas encore de blocs configurés.
          </p>
          <p className="mt-1 text-xs text-muted-fg">
            Contactez votre studio pour mettre en place la structure de la page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(({ block, index, replace }) => (
            <BlockCard
              key={block.id}
              block={block}
              index={index}
              total={total}
              mediaUrls={mediaUrls}
              mediaAlt={mediaAlt}
              onChange={replace}
            />
          ))}
        </div>
      )}
    </div>
  )
}
