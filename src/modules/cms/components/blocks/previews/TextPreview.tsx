import type React from 'react'

/**
 * Visual preview of a Text block. Plain text V1 (no Markdown) — line
 * breaks preserved via `whitespace-pre-wrap`. Same component on admin
 * and public routes so editing reflects publication exactly.
 */
export interface TextPreviewProps {
  body: string
  /** When true, render with denser admin spacing. */
  compact?: boolean
}

export function TextPreview({ body, compact = false }: TextPreviewProps): React.JSX.Element {
  const trimmed = body.trim()
  if (trimmed === '') {
    return (
      <p className="italic text-subtle-fg">
        (Bloc texte vide — cliquez sur l’icône Modifier pour le compléter.)
      </p>
    )
  }
  return (
    <div
      className={`whitespace-pre-wrap leading-relaxed text-foreground ${
        compact ? 'text-sm' : 'text-base sm:text-lg'
      }`}
    >
      {body}
    </div>
  )
}
