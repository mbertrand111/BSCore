import type React from 'react'
import { ImageOff } from 'lucide-react'

export interface GalleryItem {
  id: string
  url: string
  alt: string
}

export interface GalleryPreviewProps {
  title?: string | undefined
  items: ReadonlyArray<GalleryItem>
  /** When true (admin BlockCard), force a smaller grid. */
  compact?: boolean
}

/**
 * Visual preview of a Gallery block. Responsive grid: 2 cols on mobile,
 * 3 on tablet, 4 on desktop. Identical between admin preview (compact
 * dense) and public render (full-width breathing).
 */
export function GalleryPreview({
  title,
  items,
  compact = false,
}: GalleryPreviewProps): React.JSX.Element {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-6 py-8 text-center text-muted-fg">
        <ImageOff className="h-5 w-5 opacity-50" aria-hidden="true" />
        <p className="text-xs">Aucune image — utilisez Modifier pour en ajouter.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {title !== undefined && title !== '' ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle-fg">
          {title}
        </p>
      ) : null}
      <div
        className={`grid gap-2 ${
          compact
            ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`overflow-hidden rounded-sm bg-muted ${
              compact ? 'aspect-square' : 'aspect-[4/5]'
            }`}
          >
            {item.url !== '' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-fg">
                <ImageOff className="h-4 w-4 opacity-50" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
