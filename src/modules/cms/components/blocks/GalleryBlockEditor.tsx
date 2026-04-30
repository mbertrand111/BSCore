'use client'

import type React from 'react'
import { useState } from 'react'
import { ImageOff, ImagePlus, X } from 'lucide-react'
import { Input } from '@/shared/ui/primitives'
import {
  GALLERY_MAX_IMAGES,
  GALLERY_TITLE_MAX,
  type GalleryBlock,
} from '../../domain/blocks'
import { MediaPicker } from './MediaPicker'

export interface GalleryBlockEditorProps {
  block: GalleryBlock
  /** Map id → public URL for thumbnails. */
  mediaUrls: ReadonlyMap<string, string>
  onChange: (block: GalleryBlock) => void
}

export function GalleryBlockEditor({
  block,
  mediaUrls,
  onChange,
}: GalleryBlockEditorProps): React.JSX.Element {
  const [pickerOpen, setPickerOpen] = useState(false)

  const removeAt = (index: number): void => {
    onChange({
      ...block,
      mediaIds: block.mediaIds.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="gallery-title" className="text-xs font-medium text-foreground">
          Titre de la galerie{' '}
          <span className="text-subtle-fg">(optionnel)</span>
        </label>
        <Input
          id="gallery-title"
          value={block.title ?? ''}
          onChange={(e) => {
            const next = e.target.value
            const { title: _omitTitle, ...rest } = block
            void _omitTitle
            onChange(next === '' ? rest : { ...rest, title: next })
          }}
          placeholder="Ex. : Sélection 2025"
          maxLength={GALLERY_TITLE_MAX}
          className="mt-1.5"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground">
            Images ({block.mediaIds.length} / {GALLERY_MAX_IMAGES})
          </p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {block.mediaIds.length === 0 ? 'Choisir des images' : 'Modifier la sélection'}
          </button>
        </div>

        {block.mediaIds.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-6 py-8 text-center text-muted-fg">
            <ImageOff className="h-5 w-5 opacity-50" aria-hidden="true" />
            <p className="text-xs">
              Aucune image dans la galerie — utilisez « Choisir des images » pour en ajouter.
            </p>
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {block.mediaIds.map((id, index) => {
              const url = mediaUrls.get(id)
              return (
                <li key={`${id}-${index}`} className="relative aspect-square overflow-hidden rounded-sm bg-muted">
                  {url !== undefined ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-fg">
                      <ImageOff className="h-3 w-3 opacity-50" aria-hidden="true" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    aria-label="Retirer cette image"
                    className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute inset-0 cursor-default" />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode="multi"
        maxItems={GALLERY_MAX_IMAGES}
        initialIds={block.mediaIds}
        onConfirm={(ids) => onChange({ ...block, mediaIds: ids })}
      />
    </div>
  )
}
