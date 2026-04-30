'use client'

import type React from 'react'
import { useState } from 'react'
import {
  AlignLeft,
  Check,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  Pencil,
} from 'lucide-react'
import { BLOCK_TYPE_META, type Block, type BlockType } from '../../domain/blocks'
import { CtaBlockEditor } from './CtaBlockEditor'
import { GalleryBlockEditor } from './GalleryBlockEditor'
import { HeroBlockEditor } from './HeroBlockEditor'
import { TextBlockEditor } from './TextBlockEditor'
import { CtaPreview } from './previews/CtaPreview'
import { GalleryPreview } from './previews/GalleryPreview'
import { HeroPreview } from './previews/HeroPreview'
import { TextPreview } from './previews/TextPreview'

const TYPE_ICONS: Record<BlockType, React.ComponentType<{ className?: string }>> = {
  hero: ImageIcon,
  text: AlignLeft,
  gallery: LayoutGrid,
  cta: Megaphone,
}

export interface BlockCardProps {
  block: Block
  index: number
  total: number
  /** Map id → public URL for thumbnails (Hero / Gallery). */
  mediaUrls: ReadonlyMap<string, string>
  /** Map id → alt text for galleries. */
  mediaAlt: ReadonlyMap<string, string>
  onChange: (block: Block) => void
}

/**
 * Single block card — CMS edit mode.
 *
 * Header: type icon + label. The only action is the ✏️ pencil button which
 * toggles between preview (WYSIWYG) and inline edit (form fields). Adding,
 * removing, and reordering blocks are NOT exposed here — the structure is
 * locked by the studio. Clients only edit the content.
 */
export function BlockCard({
  block,
  index: _index,
  total: _total,
  mediaUrls,
  mediaAlt,
  onChange,
}: BlockCardProps): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const TypeIcon = TYPE_ICONS[block.type]
  const meta = BLOCK_TYPE_META[block.type]
  // index/total kept in props for future use (drag-drop, group context) but
  // intentionally unused now that reordering is studio-only.
  void _index
  void _total

  return (
    <div className="rounded-md border border-border bg-surface-elevated">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-fg">
            <TypeIcon className="h-3 w-3" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle-fg">
            Bloc {meta.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-fg hover:bg-muted hover:text-foreground"
          aria-label={editing ? 'Terminer la modification' : 'Modifier ce bloc'}
          title={editing ? 'Terminer' : 'Modifier'}
        >
          {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="p-4">
        {editing ? (
          <BlockEditor block={block} mediaUrls={mediaUrls} onChange={onChange} />
        ) : (
          <BlockPreview block={block} mediaUrls={mediaUrls} mediaAlt={mediaAlt} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal: switch on type to pick the right editor / preview
// ---------------------------------------------------------------------------

function BlockEditor({
  block,
  mediaUrls,
  onChange,
}: {
  block: Block
  mediaUrls: ReadonlyMap<string, string>
  onChange: (block: Block) => void
}): React.JSX.Element {
  switch (block.type) {
    case 'hero':
      return (
        <HeroBlockEditor
          block={block}
          mediaUrls={mediaUrls}
          onChange={(b) => onChange(b)}
        />
      )
    case 'text':
      return <TextBlockEditor block={block} onChange={(b) => onChange(b)} />
    case 'gallery':
      return (
        <GalleryBlockEditor
          block={block}
          mediaUrls={mediaUrls}
          onChange={(b) => onChange(b)}
        />
      )
    case 'cta':
      return <CtaBlockEditor block={block} onChange={(b) => onChange(b)} />
  }
}

function BlockPreview({
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
          compact
        />
      )
    }
    case 'text':
      return <TextPreview body={block.body} compact />
    case 'gallery': {
      const items = block.mediaIds.map((id) => ({
        id,
        url: mediaUrls.get(id) ?? '',
        alt: mediaAlt.get(id) ?? '',
      }))
      return (
        <GalleryPreview
          {...(block.title !== undefined ? { title: block.title } : {})}
          items={items}
          compact
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
          inert
        />
      )
  }
}
