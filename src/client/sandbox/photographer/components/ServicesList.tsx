import type React from 'react'
import Link from 'next/link'
import { services } from '../content/site-content'

/**
 * Services page composition.
 *
 * V1 wiring contract: only the page header (title + lede) is CMS-driven.
 * The three offer rows (Reportage / Week-end / Destination) stay hardcoded
 * because they encode pricing + bullet structure that the V1 CMS schema
 * doesn't model. Moving the offers to CMS would require either a Settings
 * module or a richer "offer card" block type — both out of V1 scope.
 */

export interface ServicesListProps {
  /** Page title (CMS title). Falls back to the original copy. */
  title?: string
  /** Lead paragraph under the title (CMS excerpt). Falls back to the original copy. */
  description?: string
}

export function ServicesList({ title, description }: ServicesListProps): React.JSX.Element {
  return (
    <>
      <section className="services-head">
        <div className="eyebrow" style={{ marginBottom: 24 }}>Prestations</div>
        <h1>
          {title ?? (
            <>
              Trois manières de raconter <em>votre</em> jour.
            </>
          )}
        </h1>
        <p className="services-head__lede">
          {description ??
            'Chaque reportage est ajusté à votre histoire. Voici les trois cadres principaux ; tout commence par un échange.'}
        </p>
      </section>

      <section className="services-list">
        {services.map((s) => (
          <article key={s.num} className="service-row">
            <div className="service-row__head">
              <span className="service-row__num">{s.num}</span>
              <h2 className="service-row__title">{s.title}</h2>
            </div>
            <div className="service-row__body">
              <p>{s.description}</p>
              <ul>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div className="service-row__price">
                <strong>{s.price}</strong>
                <span>· Devis sur demande</span>
              </div>
            </div>
          </article>
        ))}

        <div className="services-footer">
          <Link href="/sandbox/photographer/contact" className="btn btn--primary">
            Demander un devis
          </Link>
        </div>
      </section>
    </>
  )
}
