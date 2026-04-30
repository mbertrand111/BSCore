import type React from 'react'
import Link from 'next/link'

export interface CtaPreviewProps {
  title: string
  text?: string | undefined
  ctaLabel: string
  ctaHref: string
  /** When true, the action button is non-interactive (admin preview). */
  inert?: boolean
}

/**
 * Visual preview of a CTA block. Card with soft background, title +
 * optional text + a primary button. Used both in the admin block preview
 * (inert) and on the public route (real link).
 */
export function CtaPreview({
  title,
  text,
  ctaLabel,
  ctaHref,
  inert = false,
}: CtaPreviewProps): React.JSX.Element {
  const button = (
    <span className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
      {ctaLabel || 'Bouton'}
    </span>
  )
  return (
    <div className="rounded-md bg-muted px-6 py-8 text-center sm:py-10">
      <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        {title || "Titre de l'appel à l'action"}
      </h3>
      {text !== undefined && text !== '' ? (
        <p className="mx-auto mt-2 max-w-prose text-sm text-muted-fg">{text}</p>
      ) : null}
      <div className="mt-5">
        {inert ? (
          button
        ) : (
          <Link href={ctaHref} className="inline-block">
            {button}
          </Link>
        )}
      </div>
    </div>
  )
}
