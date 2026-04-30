import type React from 'react'
import Link from 'next/link'

export function CtaStrip(): React.JSX.Element {
  return (
    <section className="cta-strip">
      <h2 className="cta-strip__title">
        Et si nous parlions de <em>votre</em> jour ?
      </h2>
      <p className="cta-strip__sub">Quelques dates restent ouvertes pour la saison 2026.</p>
      <Link href="/sandbox/photographer/contact" className="btn btn--primary">
        Prendre contact
      </Link>
    </section>
  )
}
