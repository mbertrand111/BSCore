/**
 * Static content for the photographer sandbox.
 *
 * Sourced from the Claude Design mockup (BS Photo Sandbox). All copy is
 * placeholder marketing — French, editorial wedding photographer tone.
 *
 * Images use Unsplash CDN URLs from the original mockup. They are
 * inherently disposable — for a real client the photos would come
 * through the Media module instead.
 */

export const photographerNav = [
  { id: 'home', label: 'Accueil', href: '/sandbox/photographer' },
  { id: 'portfolio', label: 'Portfolio', href: '/sandbox/photographer/portfolio' },
  { id: 'about', label: 'À propos', href: '/sandbox/photographer/a-propos' },
  { id: 'services', label: 'Prestations', href: '/sandbox/photographer/services' },
  { id: 'contact', label: 'Contact', href: '/sandbox/photographer/contact' },
] as const

export type PhotographerNavId = (typeof photographerNav)[number]['id']

/**
 * Maps a sandbox route id to the CMS page slug it pulls its content from.
 *
 * Each sandbox page (server component) reads the corresponding CMS page via
 * `getPublishedCmsPageBySlug(slug)`. The page's title / excerpt / mainMedia /
 * blocks feed the photographer's specialized components — design stays
 * client-side, content lives in /admin/cms.
 *
 * The slugs here MUST match what `seed:demo` creates (see scripts/seed-demo.ts
 * → CMS array). When you add a new sandbox route, add its slug here AND
 * provide a corresponding CmsSpec in the seed.
 */
export const photographerCmsSlugByRoute = {
  home: 'accueil',
  portfolio: 'portfolio',
  about: 'a-propos',
  services: 'services',
  contact: 'contact',
} as const

export type PhotographerCmsRoute = keyof typeof photographerCmsSlugByRoute

export const photographerImages = {
  hero: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1800&q=80',
  portrait: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&q=80',
  feat1: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80',
  feat2: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80',
  feat3: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80',
  feat4: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80',
  pf1: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80',
  pf2: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80',
  pf3: 'https://images.unsplash.com/photo-1525772764200-be829a350797?w=900&q=80',
  pf4: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80',
  pf5: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&q=80',
  pf6: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80',
  pf7: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&q=80',
  pf8: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900&q=80',
  pf9: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=900&q=80',
  pf10: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=900&q=80',
  pf11: 'https://images.unsplash.com/photo-1597157639073-69284dc0fdaf?w=900&q=80',
  pf12: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=900&q=80',
} as const

// ---------------------------------------------------------------------------
// Featured work tiles (homepage)
// ---------------------------------------------------------------------------

export interface FeaturedTile {
  src: string
  caption: string
  location: string
  span: 'tile-7' | 'tile-5' | 'tile-7-tall' | 'tile-5-tall'
}

export const featuredTiles: ReadonlyArray<FeaturedTile> = [
  { src: photographerImages.feat1, caption: 'Camille & Hugo',  location: 'Toscane · 2025',  span: 'tile-7' },
  { src: photographerImages.feat2, caption: 'Léa & Antoine',   location: 'Luberon',         span: 'tile-5' },
  { src: photographerImages.feat3, caption: 'Marion & Paul',   location: 'Fontainebleau',   span: 'tile-5-tall' },
  { src: photographerImages.feat4, caption: 'Inès & Tom',      location: 'Étretat',         span: 'tile-7-tall' },
]

// ---------------------------------------------------------------------------
// Portfolio tiles
// ---------------------------------------------------------------------------

export type PortfolioCategory = 'ceremonie' | 'destination' | 'details'

export interface PortfolioTile {
  src: string
  caption: string
  category: PortfolioCategory
  span: 'tile-6' | 'tile-7' | 'tile-5' | 'tile-12'
}

export const portfolioTiles: ReadonlyArray<PortfolioTile> = [
  { src: photographerImages.pf1,  caption: 'Provence · 2025',     category: 'ceremonie',   span: 'tile-6' },
  { src: photographerImages.pf2,  caption: 'Toscane · 2025',      category: 'destination', span: 'tile-6' },
  { src: photographerImages.pf3,  caption: 'Luberon · 2024',      category: 'details',     span: 'tile-7' },
  { src: photographerImages.pf4,  caption: 'Fontainebleau',       category: 'ceremonie',   span: 'tile-5' },
  { src: photographerImages.pf5,  caption: 'Détails — alliances', category: 'details',     span: 'tile-5' },
  { src: photographerImages.pf6,  caption: 'Cérémonie laïque',    category: 'ceremonie',   span: 'tile-7' },
  { src: photographerImages.pf7,  caption: 'Bourgogne · 2024',    category: 'ceremonie',   span: 'tile-12' },
  { src: photographerImages.pf8,  caption: 'Bretagne · 2024',     category: 'destination', span: 'tile-6' },
  { src: photographerImages.pf9,  caption: 'Vin d’honneur',  category: 'details',     span: 'tile-6' },
  { src: photographerImages.pf10, caption: 'Rires & flou',        category: 'ceremonie',   span: 'tile-5' },
  { src: photographerImages.pf11, caption: 'Loire · sunset',      category: 'destination', span: 'tile-7' },
  { src: photographerImages.pf12, caption: 'Préparatifs',         category: 'details',     span: 'tile-12' },
]

export const portfolioFilters: ReadonlyArray<{ id: PortfolioCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Tout' },
  { id: 'ceremonie', label: 'Cérémonies' },
  { id: 'destination', label: 'Destinations' },
  { id: 'details', label: 'Détails' },
]

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export interface Service {
  num: string
  title: string
  description: string
  bullets: ReadonlyArray<string>
  price: string
}

export const services: ReadonlyArray<Service> = [
  {
    num: '01',
    title: 'La Journée',
    description:
      'De la fin des préparatifs au cœur de la soirée — environ 10 heures de présence pour saisir l’essentiel : la cérémonie, les portraits, le vin d’honneur et les premières danses.',
    bullets: [
      'Reportage de 10h',
      'Galerie privée 600+ images',
      'Tirages fine-art en option',
      'Livraison sous 8 semaines',
    ],
    price: 'À partir de 2 800 €',
  },
  {
    num: '02',
    title: 'Le Week-end',
    description:
      'Pour les mariages qui se vivent sur deux jours : repas de répétition, cérémonie, brunch du lendemain. Je vous accompagne du premier verre au dernier rire.',
    bullets: [
      'Couverture du vendredi au dimanche',
      '1 200+ images livrées',
      'Album fine-art inclus',
      'Repérage du lieu',
    ],
    price: 'À partir de 4 500 €',
  },
  {
    num: '03',
    title: 'Destination',
    description:
      'Italie, Maroc, Grèce, Espagne. Pour les mariages au loin, un forfait sur-mesure incluant déplacement, repérage et reportage complet.',
    bullets: [
      'Forfait voyage inclus',
      'Repérage la veille',
      'Reportage 2 jours',
      'Livraison express',
    ],
    price: 'Devis personnalisé',
  },
]

// ---------------------------------------------------------------------------
// SEO defaults — fed into getSeoMetadata as fallback per page
// ---------------------------------------------------------------------------

export const photographerSeoDefaults = {
  home: {
    title: 'Aurélie Lambert — Photographe de mariage haut de gamme',
    description:
      'Photographe de mariage éditorial basée à Paris. Reportages discrets, lumière naturelle, images intemporelles. Disponible en France, Italie et Europe.',
    ogImageUrl: photographerImages.hero,
  },
  portfolio: {
    title: 'Portfolio — Mariages',
    description:
      'Sélection de mariages photographiés en France et à l’étranger. Émotions, lumières naturelles, ambiances éditoriales.',
    ogImageUrl: photographerImages.feat1,
  },
  about: {
    title: 'À propos',
    description:
      'Rencontre, philosophie, regard. Aurélie photographie les mariages avec une approche éditoriale, douce et instinctive depuis 2018.',
    ogImageUrl: photographerImages.portrait,
  },
  services: {
    title: 'Prestations & Tarifs',
    description:
      'Reportage de la journée, week-end ou destination. Découvrez les prestations sur-mesure et tarifs indicatifs.',
    ogImageUrl: photographerImages.feat3,
  },
  contact: {
    title: 'Contact',
    description:
      'Parlons de votre histoire. Disponibilités, devis et premier rendez-vous sur simple demande.',
    ogImageUrl: photographerImages.feat2,
  },
} as const
