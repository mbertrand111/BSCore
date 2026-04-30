import type React from 'react'
import { photographerImages } from '../content/site-content'

export function Hero(): React.JSX.Element {
  return (
    <section className="hero">
      <div className="hero__eyebrow eyebrow">Photographie de mariage · Depuis 2018</div>
      <h1 className="hero__title display">
        L’instant <em>juste</em>, gardé pour toujours.
      </h1>
      <p className="hero__tagline">
        Reportages discrets, lumière naturelle et regard éditorial — pour les couples qui aiment
        l’élégance vraie, sans pose ni artifice.
      </p>
      <div className="hero__image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photographerImages.hero}
          alt="Mariée en lumière naturelle, ambiance éditoriale"
          loading="eager"
        />
      </div>
      <div className="hero__caption">
        <span>Domaine de la Source · Provence</span>
        <span>N° 01 — Été 2025</span>
      </div>
    </section>
  )
}
