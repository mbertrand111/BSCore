import type React from 'react'

export function Intro(): React.JSX.Element {
  return (
    <section className="intro">
      <div className="eyebrow" style={{ marginBottom: 24 }}>Mot d’intention</div>
      <p className="intro__quote">
        Je photographie comme on tient une main : doucement, fidèlement, sans jamais détourner le regard.
      </p>
      <div className="intro__signature">— Aurélie</div>
    </section>
  )
}
