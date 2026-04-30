'use client'

import type React from 'react'
import { Textarea } from '@/shared/ui/primitives'
import { TEXT_BODY_MAX, type TextBlock } from '../../domain/blocks'

export interface TextBlockEditorProps {
  block: TextBlock
  onChange: (block: TextBlock) => void
}

export function TextBlockEditor({ block, onChange }: TextBlockEditorProps): React.JSX.Element {
  return (
    <div>
      <label htmlFor="text-body" className="text-xs font-medium text-foreground">
        Contenu <span className="text-destructive">*</span>
      </label>
      <Textarea
        id="text-body"
        value={block.body}
        onChange={(e) => onChange({ ...block, body: e.target.value })}
        rows={8}
        maxLength={TEXT_BODY_MAX}
        placeholder="Écrivez votre paragraphe ici. Les retours à la ligne sont préservés."
        required
        className="mt-1.5"
      />
      <p className="mt-1 text-[11px] text-subtle-fg">
        Texte brut V1 — les retours à la ligne sont conservés. Pas de mise en forme riche pour le moment.
        ({block.body.length} / {TEXT_BODY_MAX})
      </p>
    </div>
  )
}
