import type React from 'react'
import Link from 'next/link'
import { featuredTiles } from '../content/site-content'

export function FeaturedWork(): React.JSX.Element {
  return (
    <section className="featured">
      <div className="featured__head">
        <h2 className="featured__title">
          Reportages <em>récents</em>
        </h2>
        <Link href="/sandbox/photographer/portfolio" className="btn btn--ghost">
          Voir tout le portfolio →
        </Link>
      </div>
      <div className="featured-grid">
        {featuredTiles.map((tile) => (
          <div key={tile.src} className={`featured-card ${tile.span}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tile.src} alt={`${tile.caption} — ${tile.location}`} loading="lazy" />
            <div className="featured-card__meta">
              <span>{tile.caption}</span>
              <span>{tile.location}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
