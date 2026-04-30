'use client'

import type React from 'react'
import { useState } from 'react'
import { X } from 'lucide-react'
import {
  portfolioFilters,
  portfolioTiles,
  type PortfolioCategory,
} from '../content/site-content'

type Filter = PortfolioCategory | 'all'

/**
 * Photographer portfolio grid with category filter + lightbox.
 *
 * V1 wiring contract: when CMS provides a Gallery block, we render those
 * images (URL + alt) instead of the hardcoded `portfolioTiles`. Filters
 * (Cérémonies / Destinations / Détails) are kept hardcoded — the CMS
 * Gallery block doesn't carry per-image categories. A future "rich
 * portfolio" module would add taxonomies; until then the filters stay
 * visible but only act on the hardcoded fallback set.
 *
 * Spans (tile-6 / tile-7 / tile-12 etc.) are derived deterministically by
 * index when CMS-driven so the masonry stays balanced regardless of
 * gallery size.
 */

export interface PortfolioGridProps {
  /** When provided, drives the grid (CMS gallery block resolved to URLs). */
  cmsImages?: ReadonlyArray<{ id: string; url: string; alt: string }>
  /** Page title from CMS (overrides the default "Portfolio."). */
  title?: string
}

const SPAN_CYCLE = ['tile-6', 'tile-6', 'tile-7', 'tile-5', 'tile-12', 'tile-6'] as const

export function PortfolioGrid({ cmsImages, title }: PortfolioGridProps): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>('all')
  const [lightbox, setLightbox] = useState<string | null>(null)

  // CMS-driven grid: skip the category filter (no per-image taxonomy in V1).
  // Hardcoded grid: filter by category.
  const useCms = cmsImages !== undefined && cmsImages.length > 0
  const visible = useCms
    ? cmsImages.map((img, i) => ({
        src: img.url,
        caption: img.alt,
        span: SPAN_CYCLE[i % SPAN_CYCLE.length] ?? 'tile-6',
      }))
    : portfolioTiles
        .filter((t) => filter === 'all' || t.category === filter)
        .map((t) => ({ src: t.src, caption: t.caption, span: t.span }))

  return (
    <>
      <section className="portfolio-head">
        <h1>
          {title ?? (
            <>
              Portfolio<em>.</em>
            </>
          )}
        </h1>
        {useCms ? null : (
          <div className="portfolio-filters" role="toolbar" aria-label="Filtrer le portfolio">
            {portfolioFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`portfolio-filter ${filter === f.id ? 'is-active' : ''}`}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="portfolio-grid">
        {visible.map((tile, i) => (
          <button
            key={`${tile.src}-${i}`}
            type="button"
            className={`pf-tile ${tile.span}`}
            onClick={() => setLightbox(tile.src)}
            aria-label={`Ouvrir l’image : ${tile.caption}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tile.src} alt={tile.caption} loading="lazy" />
            <div className="pf-tile__overlay">
              <span className="pf-tile__caption">{tile.caption}</span>
            </div>
          </button>
        ))}
      </section>

      {lightbox !== null ? (
        <div
          className="lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de l’image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" />
          <button
            type="button"
            className="lightbox__close"
            aria-label="Fermer"
            onClick={(e) => {
              e.stopPropagation()
              setLightbox(null)
            }}
          >
            <X size={20} />
          </button>
        </div>
      ) : null}
    </>
  )
}
