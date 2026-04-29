import type React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedCmsPageBySlug } from '@/modules/cms/data/repository'
import { isReservedSlug } from '@/modules/cms/domain/slug'
import { getMediaAssetById } from '@/modules/media/data/repository'
import { getMediaPublicUrl } from '@/modules/media/domain/storage'
import { getSeoMetadata } from '@/modules/seo/domain/metadata'

interface PublicCmsPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Generate page metadata via the SEO resolution hierarchy:
 *   1. SEO module entry for `/${slug}` (if any)
 *   2. CMS page fields (title, excerpt, main image)
 *   3. Socle baseline
 *
 * Drafts are NEVER surfaced — `getPublishedCmsPageBySlug` filters by status.
 */
export async function generateMetadata({
  params,
}: PublicCmsPageProps): Promise<Metadata> {
  const { slug } = await params
  if (isReservedSlug(slug)) return {}

  const page = await getPublishedCmsPageBySlug(slug)
  if (page === null) return {}

  // Resolve the main image's public URL (if a media asset is linked).
  let ogImageUrl: string | null = null
  if (page.mainMediaAssetId !== null) {
    const asset = await getMediaAssetById(page.mainMediaAssetId)
    if (asset !== null) {
      ogImageUrl = getMediaPublicUrl(asset)
    }
  }

  return getSeoMetadata(`/${page.slug}`, {
    title: page.title,
    ...(page.excerpt !== null ? { description: page.excerpt } : {}),
    ogImageUrl,
  })
}

export default async function PublicCmsPage({
  params,
}: PublicCmsPageProps): Promise<React.JSX.Element> {
  const { slug } = await params

  // Belt-and-suspenders: even if a row sneaked into the table with a reserved
  // slug (manual SQL, pre-existing data…), refuse to render it. Reserved
  // slugs belong to the platform / other modules.
  if (isReservedSlug(slug)) notFound()

  const page = await getPublishedCmsPageBySlug(slug)
  if (page === null) notFound()

  // Resolve main media (if any) for hero rendering.
  let mainImageUrl: string | null = null
  let mainImageAlt = ''
  if (page.mainMediaAssetId !== null) {
    const asset = await getMediaAssetById(page.mainMediaAssetId)
    if (asset !== null) {
      mainImageUrl = getMediaPublicUrl(asset)
      mainImageAlt = asset.altText || asset.originalFilename
    }
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {page.title}
        </h1>
        {page.excerpt !== null ? (
          <p className="text-lg text-muted-fg">{page.excerpt}</p>
        ) : null}
        {page.publishedAt !== null ? (
          <time
            dateTime={page.publishedAt.toISOString()}
            className="block text-sm text-muted-fg"
          >
            Published on {page.publishedAt.toLocaleDateString()}
          </time>
        ) : null}
      </header>

      {mainImageUrl !== null ? (
        <div className="mb-8 overflow-hidden rounded-card border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImageUrl}
            alt={mainImageAlt}
            className="h-auto w-full"
            loading="eager"
          />
        </div>
      ) : null}

      {/*
        V1: render content as preformatted text with line-break preservation.
        V2 will introduce Markdown rendering (or sanitized HTML) once a
        sanitization layer is in place. Keeping V1 plain-text avoids the
        XSS risk of rendering arbitrary admin-submitted HTML.
      */}
      <div className="whitespace-pre-wrap font-body text-base leading-relaxed text-foreground">
        {page.content}
      </div>
    </article>
  )
}
