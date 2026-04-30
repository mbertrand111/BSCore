import type React from 'react'
import { photographerImages } from '../content/site-content'

/**
 * About page body — portrait + intro headline + paragraphs + stats.
 *
 * CMS-driven props:
 *   - title: page title (`page.title`)
 *   - portraitUrl: resolved URL of `mainMediaAsset` (or a hero block image)
 *   - portraitAlt: alt text of the asset
 *   - paragraphs: each Text block from the CMS page → one `<p>`
 *
 * Sandbox-only / "volontairement hardcodé pour V1" :
 *   - eyebrow label "À propos"
 *   - section sub-headlines (Philosophie, Approche artistique) — would
 *     belong to a future "rich text with headings" block type
 *   - the stats trio (120+ / 14 / 2018) — would belong to a Settings
 *     module or a stats block type
 */
export interface AboutBodyProps {
  title?: string
  portraitUrl?: string
  portraitAlt?: string
  paragraphs?: ReadonlyArray<string>
}

const DEFAULT_TITLE_LEAD = 'Une photographe, un regard '
const DEFAULT_TITLE_ITALIC = 'fidèle'
const DEFAULT_TITLE_TRAIL = '.'
const DEFAULT_PARAGRAPHS: ReadonlyArray<string> = [
  "Je m’appelle Aurélie. Depuis 2018, je photographie des mariages partout en France et en Europe — souvent à la campagne, parfois en bord de mer, toujours là où la lumière prend son temps.",
  "Mon approche est simple : être présente sans être visible. Je cherche les regards qui ne se forcent pas, les gestes qui se répètent dans les familles, les rires qu’on n’entend qu’une fois.",
]

export function AboutBody({
  title,
  portraitUrl,
  portraitAlt,
  paragraphs,
}: AboutBodyProps): React.JSX.Element {
  const resolvedPortrait = portraitUrl ?? photographerImages.portrait
  const resolvedAlt = portraitAlt ?? "Portrait d’Aurélie"
  const bodyParagraphs = paragraphs !== undefined && paragraphs.length > 0 ? paragraphs : DEFAULT_PARAGRAPHS
  return (
    <section className="about">
      <div className="about__portrait">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolvedPortrait} alt={resolvedAlt} />
      </div>
      <div className="about__body">
        <div className="eyebrow">À propos</div>
        <h1 className="title">
          {title !== undefined ? (
            title
          ) : (
            <>
              {DEFAULT_TITLE_LEAD}<em>{DEFAULT_TITLE_ITALIC}</em>{DEFAULT_TITLE_TRAIL}
            </>
          )}
        </h1>
        {bodyParagraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
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
