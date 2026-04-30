/**
 * Demo seed — populates the database with realistic content so the admin
 * shell (sidebar counts, dashboard stats) can be evaluated visually without
 * hand-creating dozens of rows.
 *
 * Idempotent: every insert is gated on a unique key (`route` for SEO,
 * `storage_path` for media, `slug` for CMS pages). Re-running updates the
 * existing rows rather than duplicating them.
 *
 * Reads from .env.local via tsx --env-file-if-exists (see package.json).
 *
 * Media images:
 *   - Each MediaSpec carries a `sourceUrl` (Unsplash CDN). When SUPABASE_URL
 *     and SUPABASE_SERVICE_KEY are set AND the bucket `media` exists, the
 *     seed downloads each image and uploads it to the bucket so /admin/media
 *     displays the real photo. Existing files are skipped (idempotent).
 *   - When env or bucket is missing, the upload step is skipped with a
 *     warning and only the DB rows are inserted — the gradient placeholder
 *     in the admin grid takes over.
 *
 * Run via:  npm run seed:demo
 */
import { eq } from 'drizzle-orm'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '@/socle/config/env'
import { db } from '@/socle-plus/database/db-client'
import { seoEntries } from '@/modules/seo/data/schema'
import { mediaAssets } from '@/modules/media/data/schema'
import { cmsPages } from '@/modules/cms/data/schema'
import { userRoles } from '@/socle-plus/auth/schema'
import { STORAGE_BUCKET } from '@/modules/media/constants'
import type { Block } from '@/modules/cms/domain/blocks'

interface SeoSpec {
  route: string
  title: string
  description: string
  ogImageUrl: string
}

interface MediaSpec {
  storagePath: string
  filename: string
  altText: string
  /**
   * Public URL to download the image from. Optional — when omitted the
   * row is created in DB without uploading to the bucket (placeholder in UI).
   */
  sourceUrl?: string
}

interface CmsSpec {
  slug: string
  title: string
  excerpt: string
  content: string
  status: 'draft' | 'published'
  /** Optional rich block layout. mediaFilenames are resolved to media IDs at
   *  seed time after the media upload step, so we reference assets by their
   *  human filename here (no need to know UUIDs upfront). */
  blocks?: ReadonlyArray<BlockSpec>
}

type BlockSpec =
  | { type: 'hero'; title: string; subtitle?: string; mediaFilename?: string }
  | { type: 'text'; body: string }
  | { type: 'gallery'; title?: string; mediaFilenames: string[] }
  | {
      type: 'cta'
      title: string
      text?: string
      ctaLabel: string
      ctaHref: string
    }

const SEO: ReadonlyArray<SeoSpec> = [
  {
    route: '/sandbox/photographer',
    title: 'Aurélie Lambert — Photographe de mariage haut de gamme',
    description:
      'Photographe de mariage éditorial basée à Paris. Reportages discrets, lumière naturelle, images intemporelles.',
    ogImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
  },
  {
    route: '/sandbox/photographer/portfolio',
    title: 'Portfolio — Mariages',
    description:
      'Sélection de mariages photographiés en France et à l’étranger. Émotions, lumières naturelles, ambiances éditoriales.',
    ogImageUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80',
  },
  {
    route: '/sandbox/photographer/services',
    title: 'Prestations & Tarifs',
    description:
      'Reportage de la journée, week-end ou destination. Découvrez les prestations sur-mesure et tarifs indicatifs.',
    ogImageUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80',
  },
  {
    route: '/sandbox/photographer/a-propos',
    title: 'À propos',
    description:
      'Rencontre, philosophie, regard. Aurélie photographie les mariages avec une approche éditoriale et instinctive depuis 2018.',
    ogImageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80',
  },
  {
    route: '/sandbox/photographer/contact',
    title: 'Contact',
    description:
      'Parlons de votre histoire. Disponibilités, devis et premier rendez-vous sur simple demande.',
    ogImageUrl:
      'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80',
  },
]

// Unsplash URLs — width capped at 1600 to keep each file < 500 KB.
const U = (id: string): string =>
  `https://images.unsplash.com/photo-${id}?w=1600&q=80&fm=jpg`

const MEDIA: ReadonlyArray<MediaSpec> = [
  { storagePath: 'seed/01-camille-hugo.jpg',         filename: 'camille-hugo.jpg',         altText: 'Camille & Hugo, Toscane 2025',          sourceUrl: U('1583939003579-730e3918a45a') },
  { storagePath: 'seed/02-lea-antoine.jpg',          filename: 'lea-antoine.jpg',          altText: 'Léa & Antoine, Luberon',                sourceUrl: U('1591604466107-ec97de577aff') },
  { storagePath: 'seed/03-marion-paul.jpg',          filename: 'marion-paul.jpg',          altText: 'Marion & Paul, Fontainebleau',          sourceUrl: U('1465495976277-4387d4b0b4c6') },
  { storagePath: 'seed/04-ines-tom.jpg',             filename: 'ines-tom.jpg',             altText: 'Inès & Tom, Étretat',                   sourceUrl: U('1606216794074-735e91aa2c92') },
  { storagePath: 'seed/05-provence-2025.jpg',        filename: 'provence-2025.jpg',        altText: 'Cérémonie en Provence, 2025',           sourceUrl: U('1519741497674-611481863552') },
  { storagePath: 'seed/06-toscane-2025.jpg',         filename: 'toscane-2025.jpg',         altText: 'Mariage destination, Toscane 2025',     sourceUrl: U('1525772764200-be829a350797') },
  { storagePath: 'seed/07-luberon-2024.jpg',         filename: 'luberon-2024.jpg',         altText: 'Détails — Luberon 2024',                sourceUrl: U('1519225421980-715cb0215aed') },
  { storagePath: 'seed/08-bretagne-2024.jpg',        filename: 'bretagne-2024.jpg',        altText: 'Mariage destination, Bretagne 2024',    sourceUrl: U('1511285560929-80b456fea0bc') },
  { storagePath: 'seed/09-bourgogne.jpg',            filename: 'bourgogne.jpg',            altText: 'Cérémonie laïque, Bourgogne 2024',      sourceUrl: U('1537633552985-df8429e8048b') },
  { storagePath: 'seed/10-loire-sunset.jpg',         filename: 'loire-sunset.jpg',         altText: 'Loire au coucher du soleil',            sourceUrl: U('1469371670807-013ccf25f16a') },
  { storagePath: 'seed/11-alliances.jpg',            filename: 'alliances.jpg',            altText: 'Alliances — détail',                    sourceUrl: U('1597157639073-69284dc0fdaf') },
  { storagePath: 'seed/12-vin-honneur.jpg',          filename: 'vin-honneur.jpg',          altText: "Vin d'honneur",                          sourceUrl: U('1520854221256-17451cc331bf') },
  { storagePath: 'seed/13-preparatifs.jpg',          filename: 'preparatifs.jpg',          altText: 'Préparatifs de la mariée',              sourceUrl: U('1494790108377-be9c29b29330') },
  { storagePath: 'seed/14-portrait-aurelie.jpg',     filename: 'portrait-aurelie.jpg',     altText: 'Portrait Aurélie Lambert',              sourceUrl: U('1438761681033-6461ffad8d80') },
  { storagePath: 'seed/15-couples-2026-01.jpg',      filename: 'couples-2026-01.jpg',      altText: 'Couples 2026 — Préparation séance',     sourceUrl: U('1469371670807-013ccf25f16a') },
  { storagePath: 'seed/16-couples-2026-02.jpg',      filename: 'couples-2026-02.jpg',      altText: 'Couples 2026 — Lumière dorée',          sourceUrl: U('1519741497674-611481863552') },
  { storagePath: 'seed/17-mariage-lea-tom-hero.jpg', filename: 'mariage-lea-tom-hero.jpg', altText: 'Mariage Léa & Tom — Hero',              sourceUrl: U('1583939003579-730e3918a45a') },
  { storagePath: 'seed/18-portrait-emilie.jpg',      filename: 'portrait-emilie.jpg',      altText: 'Portrait Émilie',                       sourceUrl: U('1463453091185-61582044d556') },
  { storagePath: 'seed/19-famille-rouxel.jpg',       filename: 'famille-rouxel.jpg',       altText: 'Famille Rouxel — séance famille',       sourceUrl: U('1502672023488-70e25813eb80') },
  { storagePath: 'seed/20-atelier-coulisses.jpg',    filename: 'atelier-coulisses.jpg',    altText: 'Coulisses — atelier de tirage',         sourceUrl: U('1606216794074-735e91aa2c92') },
  { storagePath: 'seed/21-mariage-suite.jpg',        filename: 'mariage-suite.jpg',        altText: 'Suite de mariage — détails',            sourceUrl: U('1465495976277-4387d4b0b4c6') },
  { storagePath: 'seed/22-portrait-marc.jpg',        filename: 'portrait-marc.jpg',        altText: 'Portrait Marc Dubois',                  sourceUrl: U('1500648767791-00dcc994a43e') },
  { storagePath: 'seed/23-details-bague.jpg',        filename: 'details-bague.jpg',        altText: 'Détails — bague de fiançailles',        sourceUrl: U('1597157639073-69284dc0fdaf') },
  { storagePath: 'seed/24-ceremony-arch.jpg',        filename: 'ceremony-arch.jpg',        altText: 'Arche de cérémonie',                    sourceUrl: U('1519741497674-611481863552') },
  { storagePath: 'seed/25-groom-portrait.jpg',       filename: 'groom-portrait.jpg',       altText: 'Portrait du marié',                     sourceUrl: U('1507003211169-0a1dd7228f2d') },
  { storagePath: 'seed/26-reception-night.jpg',      filename: 'reception-night.jpg',      altText: 'Réception — première danse',            sourceUrl: U('1511285560929-80b456fea0bc') },
  { storagePath: 'seed/27-floral-arrangement.jpg',   filename: 'floral-arrangement.jpg',   altText: 'Composition florale',                   sourceUrl: U('1490750967868-88aa4486c946') },
  { storagePath: 'seed/28-table-setup.jpg',          filename: 'table-setup.jpg',          altText: 'Table dressée — réception',             sourceUrl: U('1464366400600-7168b8af9bc3') },
  { storagePath: 'seed/29-couple-portrait.jpg',      filename: 'couple-portrait.jpg',      altText: 'Portrait de couple',                    sourceUrl: U('1591604466107-ec97de577aff') },
  { storagePath: 'seed/30-getting-ready.jpg',        filename: 'getting-ready.jpg',        altText: 'Préparation — robe',                    sourceUrl: U('1494790108377-be9c29b29330') },
]

/**
 * Slugs that previous seed runs created but that we no longer want in the
 * /admin/cms list. They get deleted (idempotently) at the end of `seed:demo`
 * so re-running the seed converges to the desired state. Safe to remove
 * entries once you're sure they're gone from every environment.
 */
const OBSOLETE_CMS_SLUGS: ReadonlyArray<string> = [
  'a-propos-test',
  'tarifs',
  'galeries-couples-2026',
  'mariages',
  'portraits',
  'journal',
  'mentions-legales',
]

const CMS: ReadonlyArray<CmsSpec> = [
  // -------------------------------------------------------------------------
  // Sandbox-aligned pages — these slugs are the source of truth for the
  // photographer sandbox routes (see photographerCmsSlugByRoute). Each must
  // exist in `published` state for the public sandbox page to render.
  // -------------------------------------------------------------------------
  {
    slug: 'accueil',
    title: "L'instant juste, gardé pour toujours.",
    excerpt:
      'Reportages discrets, lumière naturelle et regard éditorial — pour les couples qui aiment l’élégance vraie, sans pose ni artifice.',
    content:
      "Photographe de mariage éditorial basée à Paris. Disponible en France, en Italie et en Europe.",
    status: 'published',
    blocks: [
      {
        type: 'hero',
        title: "L'instant juste, gardé pour toujours.",
        subtitle:
          'Reportages discrets, lumière naturelle et regard éditorial — pour les couples qui aiment l’élégance vraie.',
        mediaFilename: 'provence-2025.jpg',
      },
    ],
  },
  {
    slug: 'a-propos',
    title: 'Une photographe, un regard fidèle.',
    excerpt:
      "Photographe de mariage depuis 2018, j'accompagne les couples qui cherchent une approche éditoriale et discrète.",
    content: [
      "Je m'appelle Aurélie. Depuis 2018, je photographie des mariages partout en France et en Europe — souvent à la campagne, parfois en bord de mer, toujours là où la lumière prend son temps.",
      "Mon approche est simple : être présente sans être visible. Je cherche les regards qui ne se forcent pas, les gestes qui se répètent dans les familles, les rires qu'on n'entend qu'une fois.",
    ].join('\n\n'),
    status: 'published',
    blocks: [
      {
        type: 'hero',
        title: 'Une photographe, un regard fidèle.',
        subtitle: 'Photographe de mariage éditoriale, basée à Paris.',
        mediaFilename: 'portrait-aurelie.jpg',
      },
      {
        type: 'text',
        body:
          "Je m'appelle Aurélie. Depuis 2018, je photographie des mariages partout en France et en Europe — souvent à la campagne, parfois en bord de mer, toujours là où la lumière prend son temps.",
      },
      {
        type: 'text',
        body:
          "Mon approche est simple : être présente sans être visible. Je cherche les regards qui ne se forcent pas, les gestes qui se répètent dans les familles, les rires qu'on n'entend qu'une fois.",
      },
    ],
  },
  {
    slug: 'portfolio',
    title: 'Portfolio.',
    excerpt:
      'Sélection de mariages photographiés en France et à l’étranger. Émotions, lumières naturelles, ambiances éditoriales.',
    content: 'Sélection de reportages de mariage et séances couple, 2024–2026.',
    status: 'published',
    blocks: [
      {
        type: 'hero',
        title: 'Portfolio.',
        subtitle: 'Une sélection de mariages et séances, 2024–2026.',
        mediaFilename: 'camille-hugo.jpg',
      },
      {
        type: 'gallery',
        title: 'Sélection',
        mediaFilenames: [
          'camille-hugo.jpg',
          'lea-antoine.jpg',
          'marion-paul.jpg',
          'ines-tom.jpg',
          'provence-2025.jpg',
          'toscane-2025.jpg',
          'luberon-2024.jpg',
          'bretagne-2024.jpg',
          'bourgogne.jpg',
          'loire-sunset.jpg',
          'alliances.jpg',
          'vin-honneur.jpg',
        ],
      },
    ],
  },
  {
    slug: 'services',
    title: 'Trois manières de raconter votre jour.',
    excerpt:
      'Chaque reportage est ajusté à votre histoire. Voici les trois cadres principaux ; tout commence par un échange.',
    content:
      'La Journée, le Week-end, Destination — devis personnalisés après un premier échange.',
    status: 'published',
    blocks: [
      {
        type: 'hero',
        title: 'Trois manières de raconter votre jour.',
        subtitle: 'La Journée, le Week-end, Destination.',
        mediaFilename: 'marion-paul.jpg',
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Parlons de votre jour.',
    excerpt:
      "Quelques lignes suffisent pour démarrer. Dites-moi la date, le lieu, et trois mots qui définissent l'ambiance que vous imaginez. Je vous réponds sous 48 heures, toujours personnellement.",
    content: 'Premier échange par mail ou téléphone — réponse sous 48 heures.',
    status: 'published',
    blocks: [
      {
        type: 'hero',
        title: 'Parlons de votre jour.',
        subtitle: 'Réponse sous 48 heures, toujours personnellement.',
        mediaFilename: 'lea-antoine.jpg',
      },
    ],
  },

]

// ---------------------------------------------------------------------------
// Storage upload helpers — push real images to Supabase Storage so /admin/media
// shows actual photos instead of the deterministic gradient placeholder.
// ---------------------------------------------------------------------------

interface BucketAdapter {
  /** Returns 'created' on upload, 'skipped' if the file already exists,
   *  'failed' on any other error (logged, not thrown — seed must keep going). */
  uploadIfMissing(storagePath: string, sourceUrl: string): Promise<'created' | 'skipped' | 'failed'>
  /** Returns the actual byte size after upload, or a sensible default. */
  getSize(storagePath: string): Promise<number>
}

function buildStorageClient(): SupabaseClient | null {
  const url = getEnv('SUPABASE_URL')
  const key = getEnv('SUPABASE_SERVICE_KEY')
  if (url === undefined || url === '' || key === undefined || key === '') {
    return null
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function buildBucketAdapter(): Promise<BucketAdapter | null> {
  const client = buildStorageClient()
  if (client === null) {
    console.log(
      '[seed:demo] SUPABASE_SERVICE_KEY missing — skipping image uploads (placeholders only)',
    )
    return null
  }
  // Probe the bucket once so we fail fast with a clear message.
  const { data, error } = await client.storage.getBucket(STORAGE_BUCKET)
  if (error || !data) {
    console.log(
      `[seed:demo] bucket "${STORAGE_BUCKET}" unreachable (${error?.message ?? 'not found'}) — skipping uploads`,
    )
    return null
  }

  // List existing files once so subsequent uploads can short-circuit. Folder
  // is `seed/`; we only care about presence-by-name.
  const existing = new Set<string>()
  const { data: list } = await client.storage.from(STORAGE_BUCKET).list('seed', { limit: 1000 })
  if (list !== null) {
    for (const row of list) existing.add(`seed/${row.name}`)
  }

  return {
    async uploadIfMissing(storagePath, sourceUrl): Promise<'created' | 'skipped' | 'failed'> {
      if (existing.has(storagePath)) return 'skipped'
      try {
        const res = await fetch(sourceUrl)
        if (!res.ok) {
          console.warn(`  ! download failed (${res.status}): ${sourceUrl}`)
          return 'failed'
        }
        const buffer = await res.arrayBuffer()
        const { error: upErr } = await client.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, buffer, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
            upsert: false,
          })
        if (upErr !== null) {
          // "The resource already exists" — race with a concurrent run.
          if (upErr.message.toLowerCase().includes('already exists')) return 'skipped'
          console.warn(`  ! upload failed: ${upErr.message}`)
          return 'failed'
        }
        existing.add(storagePath)
        return 'created'
      } catch (err) {
        console.warn(
          `  ! upload exception: ${err instanceof Error ? err.message : String(err)}`,
        )
        return 'failed'
      }
    },
    async getSize(storagePath): Promise<number> {
      // The list() metadata carries the byte size — but we may have just
      // uploaded a new file. Re-list the parent folder cheaply.
      try {
        const { data: rows } = await client.storage
          .from(STORAGE_BUCKET)
          .list('seed', { search: storagePath.replace('seed/', '') })
        const match = rows?.find((r) => `seed/${r.name}` === storagePath)
        const size = match?.metadata?.size
        if (typeof size === 'number') return size
      } catch {
        // fall through
      }
      return 250_000 // sensible default if metadata unavailable
    },
  }
}

async function findAnyUserId(): Promise<string> {
  const rows = await db.select({ userId: userRoles.userId }).from(userRoles).limit(1)
  const id = rows[0]?.userId
  if (id === undefined) {
    throw new Error(
      'No user found in user_roles. Run `npm run seed:e2e` first to create the demo users.',
    )
  }
  return id
}

async function upsertSeo(spec: SeoSpec): Promise<'created' | 'updated'> {
  const existing = await db
    .select({ id: seoEntries.id })
    .from(seoEntries)
    .where(eq(seoEntries.route, spec.route))
    .limit(1)
  if (existing[0]) {
    await db
      .update(seoEntries)
      .set({
        title: spec.title,
        description: spec.description,
        ogImageUrl: spec.ogImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(seoEntries.id, existing[0].id))
    return 'updated'
  }
  await db.insert(seoEntries).values({
    route: spec.route,
    title: spec.title,
    description: spec.description,
    ogImageUrl: spec.ogImageUrl,
  })
  return 'created'
}

type MediaResult = 'db-created' | 'db-updated' | 'db-skipped'
type StorageResult = 'uploaded' | 'skipped' | 'failed' | 'no-source' | 'no-bucket'

async function upsertMedia(
  spec: MediaSpec,
  createdBy: string,
  bucket: BucketAdapter | null,
): Promise<{ db: MediaResult; storage: StorageResult }> {
  // 1. Storage: upload the file (or skip if already there).
  //    No bucket / no source / failed upload → DON'T touch the DB. We do
  //    not want phantom rows pointing to non-existent files in storage —
  //    the admin grid would render "Image manquante" placeholders which
  //    defeats the demo.
  let storage: StorageResult
  if (bucket === null) {
    storage = 'no-bucket'
  } else if (spec.sourceUrl === undefined) {
    storage = 'no-source'
  } else {
    const result = await bucket.uploadIfMissing(spec.storagePath, spec.sourceUrl)
    storage = result === 'created' ? 'uploaded' : result === 'skipped' ? 'skipped' : 'failed'
  }

  if (storage === 'no-bucket' || storage === 'no-source' || storage === 'failed') {
    return { db: 'db-skipped', storage }
  }

  const sizeBytes = await bucket!.getSize(spec.storagePath)
  const existing = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(eq(mediaAssets.storagePath, spec.storagePath))
    .limit(1)
  if (existing[0]) {
    await db
      .update(mediaAssets)
      .set({ altText: spec.altText, sizeBytes, updatedAt: new Date() })
      .where(eq(mediaAssets.id, existing[0].id))
    return { db: 'db-updated', storage }
  }
  await db.insert(mediaAssets).values({
    storagePath: spec.storagePath,
    originalFilename: spec.filename,
    mimeType: 'image/jpeg',
    sizeBytes,
    altText: spec.altText,
    createdBy,
  })
  return { db: 'db-created', storage }
}

async function upsertCms(
  spec: CmsSpec,
  createdBy: string,
  mediaIdByFilename: ReadonlyMap<string, string>,
): Promise<'created' | 'updated'> {
  const blocks = spec.blocks !== undefined ? buildBlocks(spec.blocks, mediaIdByFilename) : []
  const blocksValue = blocks as unknown as typeof cmsPages.$inferInsert.blocks

  const existing = await db
    .select({ id: cmsPages.id })
    .from(cmsPages)
    .where(eq(cmsPages.slug, spec.slug))
    .limit(1)
  if (existing[0]) {
    await db
      .update(cmsPages)
      .set({
        title: spec.title,
        excerpt: spec.excerpt,
        content: spec.content,
        blocks: blocksValue,
        status: spec.status,
        updatedAt: new Date(),
      })
      .where(eq(cmsPages.id, existing[0].id))
    return 'updated'
  }
  const publishedAt = spec.status === 'published' ? new Date() : null
  await db.insert(cmsPages).values({
    slug: spec.slug,
    title: spec.title,
    excerpt: spec.excerpt,
    content: spec.content,
    blocks: blocksValue,
    status: spec.status,
    createdBy,
    ...(publishedAt !== null ? { publishedAt } : {}),
  })
  return 'created'
}

/**
 * Convert a BlockSpec[] (filename references) into runtime Block[] (UUID
 * references). Filenames that don't resolve to a media id are dropped from
 * Hero (mediaId omitted) and Gallery (filtered out of mediaIds) — the seed
 * keeps going rather than failing on a missing asset.
 */
function buildBlocks(
  specs: ReadonlyArray<BlockSpec>,
  mediaIdByFilename: ReadonlyMap<string, string>,
): Block[] {
  return specs.map((spec): Block => {
    const id = blockId()
    if (spec.type === 'hero') {
      const mediaId =
        spec.mediaFilename !== undefined ? mediaIdByFilename.get(spec.mediaFilename) : undefined
      return {
        id,
        type: 'hero',
        version: 1,
        title: spec.title,
        ...(spec.subtitle !== undefined ? { subtitle: spec.subtitle } : {}),
        ...(mediaId !== undefined ? { mediaId } : {}),
      }
    }
    if (spec.type === 'text') {
      return { id, type: 'text', version: 1, body: spec.body }
    }
    if (spec.type === 'gallery') {
      const mediaIds = spec.mediaFilenames
        .map((f) => mediaIdByFilename.get(f))
        .filter((v): v is string => v !== undefined)
      return {
        id,
        type: 'gallery',
        version: 1,
        ...(spec.title !== undefined ? { title: spec.title } : {}),
        mediaIds,
      }
    }
    return {
      id,
      type: 'cta',
      version: 1,
      title: spec.title,
      ...(spec.text !== undefined ? { text: spec.text } : {}),
      ctaLabel: spec.ctaLabel,
      ctaHref: spec.ctaHref,
    }
  })
}

function blockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

async function main(): Promise<void> {
  console.log('[seed:demo] starting')
  const createdBy = await findAnyUserId()
  console.log(`[seed:demo] using user ${createdBy} as createdBy`)

  // Probe Storage once — null if env missing or bucket unreachable. The seed
  // continues either way: DB rows always insert; the upload step degrades
  // gracefully to a no-op + warning.
  const bucket = await buildBucketAdapter()

  let dbCreated = 0
  let dbUpdated = 0
  let storageUploaded = 0
  let storageSkipped = 0
  let storageFailed = 0

  for (const spec of SEO) {
    const result = await upsertSeo(spec)
    if (result === 'created') dbCreated += 1
    else dbUpdated += 1
    console.log(`  ✓ seo ${result}: ${spec.route}`)
  }

  let mediaSkipped = 0
  for (const spec of MEDIA) {
    const { db: dbResult, storage } = await upsertMedia(spec, createdBy, bucket)
    if (dbResult === 'db-created') dbCreated += 1
    else if (dbResult === 'db-updated') dbUpdated += 1
    else mediaSkipped += 1
    if (storage === 'uploaded') storageUploaded += 1
    else if (storage === 'skipped') storageSkipped += 1
    else if (storage === 'failed') storageFailed += 1
    const tag =
      storage === 'uploaded'
        ? '+upload'
        : storage === 'skipped'
          ? '·exists'
          : storage === 'failed'
            ? '·upload-failed (DB skipped)'
            : storage === 'no-bucket'
              ? '·no-bucket (DB skipped)'
              : '·no-source (DB skipped)'
    console.log(`  ${dbResult === 'db-skipped' ? '·' : '✓'} media ${dbResult}: ${spec.storagePath} ${tag}`)
  }

  if (mediaSkipped > 0) {
    console.log(
      `[seed:demo] ${mediaSkipped} média(s) ignoré(s) — configure SUPABASE_SERVICE_KEY + le bucket "${STORAGE_BUCKET}" pour les seeder pour de vrai`,
    )
  }

  // Build a filename → id map from the DB (covers both this run's inserts
  // and pre-existing rows from previous runs). CMS blocks reference media
  // by filename so the block layouts above don't have to know UUIDs.
  const mediaIdByFilename = new Map<string, string>()
  const allMedia = await db
    .select({ id: mediaAssets.id, originalFilename: mediaAssets.originalFilename })
    .from(mediaAssets)
  for (const row of allMedia) {
    mediaIdByFilename.set(row.originalFilename, row.id)
  }

  for (const spec of CMS) {
    const result = await upsertCms(spec, createdBy, mediaIdByFilename)
    if (result === 'created') dbCreated += 1
    else dbUpdated += 1
    const blockSummary =
      spec.blocks !== undefined ? ` · ${spec.blocks.length} bloc(s)` : ''
    console.log(`  ✓ cms ${result}: /${spec.slug} (${spec.status})${blockSummary}`)
  }

  // Drop pages from previous seed runs that we no longer want around.
  let dbDeleted = 0
  for (const slug of OBSOLETE_CMS_SLUGS) {
    const result = await db
      .delete(cmsPages)
      .where(eq(cmsPages.slug, slug))
      .returning({ id: cmsPages.id })
    if (result.length > 0) {
      dbDeleted += 1
      console.log(`  · cms deleted (obsolete): /${slug}`)
    }
  }

  console.log(
    `[seed:demo] done — db: created=${dbCreated} updated=${dbUpdated} deleted=${dbDeleted} · storage: uploaded=${storageUploaded} existing=${storageSkipped} failed=${storageFailed}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(`[seed:demo] failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
