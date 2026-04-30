import type React from 'react'

/**
 * Contact page panel.
 *
 * V1 wiring contract: only the page header (title + intro paragraph) is
 * CMS-driven. The contact details column (email / phone / address / social)
 * stays hardcoded because it belongs to a future Settings module — putting
 * coordinates inside a CMS "page" would conflate content with project
 * configuration. The signature is also kept hardcoded as it's design copy.
 */

export interface ContactPanelProps {
  /** Page title (CMS title). Falls back to the original copy. */
  title?: string
  /** Intro paragraph under the title (CMS excerpt). Falls back to the original copy. */
  intro?: string
}

export function ContactPanel({ title, intro }: ContactPanelProps): React.JSX.Element {
  return (
    <section className="contact">
      <div className="contact__lead">
        <div className="eyebrow" style={{ marginBottom: 24 }}>Contact</div>
        <h1>
          {title ?? (
            <>
              Parlons de <em>votre</em> jour.
            </>
          )}
        </h1>
        <p>
          {intro ??
            'Quelques lignes suffisent pour démarrer. Dites-moi la date, le lieu, et trois mots qui définissent l’ambiance que vous imaginez. Je vous réponds sous 48 heures, toujours personnellement.'}
        </p>
        <p>Les rendez-vous se font au studio ou en visio — selon votre disponibilité.</p>
        <p className="signature">
          À très vite,<br />Aurélie
        </p>
      </div>
      <div className="contact__details">
        <h3>Écrire</h3>
        <p>
          <a href="mailto:bonjour@aurelie-lambert.fr">bonjour@aurelie-lambert.fr</a>
        </p>
        <h3>Appeler</h3>
        <p>
          <a href="tel:+33612345678">+33 6 12 34 56 78</a>
        </p>
        <h3>Studio</h3>
        <p style={{ fontSize: 18 }}>
          14 rue des Saints-Pères
          <br />
          75007 Paris
        </p>
        <div className="contact__social">
          <a href="#" rel="noopener noreferrer">Instagram</a>
          <a href="#" rel="noopener noreferrer">Pinterest</a>
        </div>
      </div>
    </section>
  )
}
