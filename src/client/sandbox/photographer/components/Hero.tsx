import type React from 'react'
import { photographerImages } from '../content/site-content'

/**
 * Hero block of the photographer home page.
 *
 * Content props are optional with hardcoded fallbacks — when the page
 * server-component fetches a CMS page, it passes the values; otherwise
 * (no CMS row, dev environment without seed) the hero still renders with
 * the demo copy so the page never looks broken.
 *
 * Design (typography, gradient, spacing) stays sandbox-only.
 */
export interface HeroProps {
  /** Big italic title — typically `cmsPage.title` or a hero block title. */
  title?: string
  /** Tagline shown below the title — typically `cmsPage.excerpt`. */
  tagline?: string
  /** Hero image — resolved Supabase Storage URL via getMediaPublicUrl. */
  imageUrl?: string
  imageAlt?: string
}

const DEFAULT_TITLE_LEAD = "L’instant"
const DEFAULT_TITLE_ITALIC = 'juste'
const DEFAULT_TITLE_TRAIL = ', gardé pour toujours.'
const DEFAULT_TAGLINE =
  'Reportages discrets, lumière naturelle et regard éditorial — pour les couples qui aiment l’élégance vraie, sans pose ni artifice.'

export function Hero({ title, tagline, imageUrl, imageAlt }: HeroProps): React.JSX.Element {
  const resolvedImage = imageUrl ?? photographerImages.hero
  const resolvedAlt = imageAlt ?? 'Mariée en lumière naturelle, ambiance éditoriale'
  return (
    <section className="hero">
      <div className="hero__eyebrow eyebrow">Photographie de mariage · Depuis 2018</div>
      <h1 className="hero__title display">
        {title !== undefined ? (
          title
        ) : (
          <>
            {DEFAULT_TITLE_LEAD} <em>{DEFAULT_TITLE_ITALIC}</em>
            {DEFAULT_TITLE_TRAIL}
          </>
        )}
      </h1>
      <p className="hero__tagline">{tagline ?? DEFAULT_TAGLINE}</p>
      <div className="hero__image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolvedImage} alt={resolvedAlt} loading="eager" />
      </div>
      <div className="hero__caption">
        <span>Domaine de la Source · Provence</span>
        <span>N° 01 — Été 2025</span>
      </div>
    </section>
  )
}
