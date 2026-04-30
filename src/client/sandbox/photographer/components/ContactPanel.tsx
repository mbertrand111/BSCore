import type React from 'react'

export function ContactPanel(): React.JSX.Element {
  return (
    <section className="contact">
      <div className="contact__lead">
        <div className="eyebrow" style={{ marginBottom: 24 }}>Contact</div>
        <h1>
          Parlons de <em>votre</em> jour.
        </h1>
        <p>
          Quelques lignes suffisent pour démarrer. Dites-moi la date, le lieu, et trois mots qui
          définissent l’ambiance que vous imaginez. Je vous réponds sous 48 heures, toujours
          personnellement.
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
