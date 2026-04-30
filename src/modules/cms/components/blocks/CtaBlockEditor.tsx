'use client'

import type React from 'react'
import { Input, Textarea } from '@/shared/ui/primitives'
import {
  CTA_HREF_MAX,
  CTA_LABEL_MAX,
  CTA_TEXT_MAX,
  CTA_TITLE_MAX,
  type CtaBlock,
} from '../../domain/blocks'

export interface CtaBlockEditorProps {
  block: CtaBlock
  onChange: (block: CtaBlock) => void
}

export function CtaBlockEditor({ block, onChange }: CtaBlockEditorProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Field label="Titre" required>
        <Input
          value={block.title}
          onChange={(e) => onChange({ ...block, title: e.target.value })}
          placeholder="Réservez une séance"
          maxLength={CTA_TITLE_MAX}
          required
        />
      </Field>

      <Field label="Texte d'accroche" hint="Optionnel — une à deux phrases.">
        <Textarea
          value={block.text ?? ''}
          onChange={(e) => {
            const next = e.target.value
            const { text: _omitText, ...rest } = block
            void _omitText
            onChange(next === '' ? rest : { ...rest, text: next })
          }}
          rows={2}
          maxLength={CTA_TEXT_MAX}
          placeholder="Disponibilités jusqu'en septembre."
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Libellé du bouton" required>
          <Input
            value={block.ctaLabel}
            onChange={(e) => onChange({ ...block, ctaLabel: e.target.value })}
            placeholder="Réserver"
            maxLength={CTA_LABEL_MAX}
            required
          />
        </Field>

        <Field
          label="Lien du bouton"
          required
          hint="Chemin interne (/contact) ou URL absolue (https://…)."
        >
          <Input
            value={block.ctaHref}
            onChange={(e) => onChange({ ...block, ctaHref: e.target.value })}
            placeholder="/contact"
            maxLength={CTA_HREF_MAX}
            required
          />
        </Field>
      </div>
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
