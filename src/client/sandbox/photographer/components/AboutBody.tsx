import type React from 'react'
import { photographerImages } from '../content/site-content'

export function AboutBody(): React.JSX.Element {
  return (
    <section className="about">
      <div className="about__portrait">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photographerImages.portrait} alt="Portrait d’Aurélie" />
      </div>
      <div className="about__body">
        <div className="eyebrow">À propos</div>
        <h1 className="title">
          Une photographe, un regard <em>fidèle</em>.
        </h1>
        <p>
          Je m’appelle Aurélie. Depuis 2018, je photographie des mariages partout en France et en
          Europe — souvent à la campagne, parfois en bord de mer, toujours là où la lumière prend son temps.
        </p>
        <p>
          Mon approche est simple : être présente sans être visible. Je cherche les regards qui ne se
          forcent pas, les gestes qui se répètent dans les familles, les rires qu’on n’entend qu’une fois.
        </p>
        <h3>Philosophie</h3>
        <p>
          Je crois aux images qui vieillissent bien — sans filtre à la mode, sans pose imposée. Je
          travaille en lumière naturelle, en argentique parfois, et je livre des reportages denses,
          nuancés, qui respirent.
        </p>
        <h3>Approche artistique</h3>
        <p>
          Chaque couple est unique ; le reportage l’est aussi. Avant le jour J, nous échangeons
          longuement pour comprendre votre histoire, votre lieu, votre rythme. Le jour venu, je
          m’efface — et je laisse votre journée parler d’elle-même.
        </p>
        <div className="about-stats">
          <div>
            <strong>120+</strong>
            <span>Mariages photographiés</span>
          </div>
          <div>
            <strong>14</strong>
            <span>Pays visités</span>
          </div>
          <div>
            <strong>2018</strong>
            <span>Première saison</span>
          </div>
        </div>
      </div>
    </section>
  )
}
