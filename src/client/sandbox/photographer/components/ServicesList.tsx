import type React from 'react'
import Link from 'next/link'
import { services } from '../content/site-content'

export function ServicesList(): React.JSX.Element {
  return (
    <>
      <section className="services-head">
        <div className="eyebrow" style={{ marginBottom: 24 }}>Prestations</div>
        <h1>
          Trois manières de raconter <em>votre</em> jour.
        </h1>
        <p className="services-head__lede">
          Chaque reportage est ajusté à votre histoire. Voici les trois cadres principaux ; tout
          commence par un échange.
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
