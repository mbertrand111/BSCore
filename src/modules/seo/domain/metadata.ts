import 'server-only'

import type { Metadata } from 'next'
import { getSiteUrl } from '@/socle/config/site'
import { getSeoEntryByRoute, type SeoEntry } from '../data/repository'
import { normalizeRoute } from './normalize'

/**
 * Optional fallback values, used when no SEO entry exists for the route.
 * These typically come from the page itself or the parent module
 * (e.g. CMS page title) rather than the platform baseline.
 */
export interface MetadataFallback {
  title?: string
  description?: string
  ogImageUrl?: string | null
}

/**
 * Lookup a SEO entry by route. Path is normalized; query / hash stripped.
 * Returns null when no row exists for that route.
 */
export async function getSeoEntry(route: string): Promise<SeoEntry | null> {
  return getSeoEntryByRoute(route)
}

/**
 * Build a Next.js Metadata object for the given route.
 *
 * Resolution order (per FRONTEND.md and SEO_RULES.md):
 *   1. SEO entry from DB (if present)
 *   2. caller-provided fallback (page-level defaults)
 *   3. Socle baseline (handled by Next.js metadata merging at the layout level)
 *
 * The function is purely deterministic given (route, fallback, DB state).
 * No implicit merge — every field is sourced from a single tier.
 *
 * Usage:
 *   export async function generateMetadata() {
 *     return getSeoMetadata('/ma-page', {
 *       title: 'Fallback title',
 *       description: 'Fallback description',
 *     })
 *   }
 */
export async function getSeoMetadata(
  route: string,
  fallback?: MetadataFallback,
): Promise<Metadata> {
  const normalized = normalizeRoute(route)
  const entry = await getSeoEntryByRoute(normalized)
  const siteUrl = getSiteUrl()
  const url = `${siteUrl}${normalized}`

  // Title / description: entry → fallback → undefined (root layout fills it).
  const title = entry?.title ?? fallback?.title
  const description = entry?.description ?? fallback?.description

  // Canonical: explicit override on entry, else default to ${siteUrl}${route}.
  const canonical = entry?.canonicalUrl ?? url

  // OG / Twitter image: entry override, else fallback, else nothing.
  const ogImage = entry?.ogImageUrl ?? fallback?.ogImageUrl ?? null
  const twitterImage = entry?.twitterImageUrl ?? fallback?.ogImageUrl ?? null

  // OG / Twitter title and description: entry-specific, else inherit `title` / `description`.
  const ogTitle = entry?.ogTitle ?? title
  const ogDescription = entry?.ogDescription ?? description
  const twitterTitle = entry?.twitterTitle ?? title
  const twitterDescription = entry?.twitterDescription ?? description

  // Robots: entry override, else inherit baseline (true / true).
  const robotsIndex = entry?.robotsIndex ?? true
  const robotsFollow = entry?.robotsFollow ?? true

  const metadata: Metadata = {
    alternates: { canonical },
    robots: { index: robotsIndex, follow: robotsFollow },
    openGraph: {
      type: 'website',
      url,
      ...(ogTitle !== undefined ? { title: ogTitle } : {}),
      ...(ogDescription !== undefined ? { description: ogDescription } : {}),
      ...(ogImage !== null ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(twitterTitle !== undefined ? { title: twitterTitle } : {}),
      ...(twitterDescription !== undefined ? { description: twitterDescription } : {}),
      ...(twitterImage !== null ? { images: [twitterImage] } : {}),
    },
  }

  if (title !== undefined) metadata.title = title
  if (description !== undefined) metadata.description = description

  return metadata
}
