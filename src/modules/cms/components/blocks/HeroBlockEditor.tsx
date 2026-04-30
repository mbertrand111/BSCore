'use client'

import type React from 'react'
import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Input, Textarea } from '@/shared/ui/primitives'
import { HERO_SUBTITLE_MAX, HERO_TITLE_MAX, type HeroBlock } from '../../domain/blocks'
import { MediaPicker } from './MediaPicker'

export interface HeroBlockEditorProps {
  block: HeroBlock
  /**
   * Map from media id to its public URL for the preview thumbnail. Provided
   * by the parent so the editor doesn't have to refetch on every render.
   */
  mediaUrls: ReadonlyMap<string, string>
  onChange: (block: HeroBlock) => void
}

export function HeroBlockEditor({
  block,
  mediaUrls,
  onChange,
}: HeroBlockEditorProps): React.JSX.Element {
  const [pickerOpen, setPickerOpen] = useState(false)
  const heroImageUrl = block.mediaId !== undefined ? mediaUrls.get(block.mediaId) : undefined

  return (
    <div className="space-y-4">
      <Field label="Titre" required hint={`${block.title.length} / ${HERO_TITLE_MAX}`}>
        <Input
          name="hero-title"
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Capturer l'instant juste."
          maxLength={HERO_TITLE_MAX}
          required
        />
      </Field>

      <Field
        label="Sous-titre"
        hint={`Optionnel · ${block.subtitle?.length ?? 0} / ${HERO_SUBTITLE_MAX}`}
      >
        <Textarea
          name="hero-subtitle"
          value={block.subtitle ?? ''}
          onChange={(e) => {
            const next = e.target.value
            // Conditional spread keeps the field absent (rather than
            // explicit `undefined`) so exactOptionalPropertyTypes is happy.
            const { subtitle: _omitSubtitle, ...rest } = block
            void _omitSubtitle
            onChange(next === '' ? rest : { ...rest, subtitle: next })
          }}
          rows={2}
          placeholder="Photographe d'événements et de portraits — Lyon & alentours."
          maxLength={HERO_SUBTITLE_MAX}
        />
      </Field>

      <Field
        label="Image de fond"
        hint="Optionnelle — affichée en fond du hero avec un dégradé sombre par-dessus."
      >
        <div className="flex items-center gap-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
            {heroImageUrl !== undefined ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              {block.mediaId !== undefined ? "Changer l'image" : 'Choisir une image'}
            </button>
            {block.mediaId !== undefined ? (
              <button
                type="button"
                onClick={() => {
                  const { mediaId: _omitMediaId, ...rest } = block
                  void _omitMediaId
                  onChange(rest)
                }}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-fg hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" /> Retirer
              </button>
            ) : null}
          </div>
        </div>
      </Field>

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode="single"
        initialIds={block.mediaId !== undefined ? [block.mediaId] : []}
        onConfirm={(ids) => {
          const id = ids[0]
          if (id === undefined) {
            const { mediaId: _omit, ...rest } = block
            void _omit
            onChange(rest)
            return
          }
          onChange({ ...block, mediaId: id })
        }}
      />
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div>
      <label className="text-xs font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint !== undefined ? <p className="mt-1 text-[11px] text-subtle-fg">{hint}</p> : null}
    </div>
  )
}
