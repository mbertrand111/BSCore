import type React from 'react'

export function QuoteStrip(): React.JSX.Element {
  return (
    <section className="quote">
      <div className="quote__mark">&ldquo;</div>
      <blockquote className="quote__text">
        Aurélie a saisi notre journée comme un souvenir qu’on aurait écrit nous-mêmes.
      </blockquote>
      <div className="quote__attr">Camille &amp; Hugo · Mariés en juin 2025</div>
    </section>
  )
}
