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

export function PortfolioGrid(): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>('all')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const visible = portfolioTiles.filter((t) => filter === 'all' || t.category === filter)

  return (
    <>
      <section className="portfolio-head">
        <h1>
          Portfolio<em>.</em>
        </h1>
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
      </section>

      <section className="portfolio-grid">
        {visible.map((tile) => (
          <button
            key={tile.src}
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
