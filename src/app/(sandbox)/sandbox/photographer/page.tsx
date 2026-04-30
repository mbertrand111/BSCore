import type React from 'react'
import type { Metadata } from 'next'
import { Hero } from '@/client/sandbox/photographer/components/Hero'
import { Intro } from '@/client/sandbox/photographer/components/Intro'
import { FeaturedWork } from '@/client/sandbox/photographer/components/FeaturedWork'
import { QuoteStrip } from '@/client/sandbox/photographer/components/QuoteStrip'
import { CtaStrip } from '@/client/sandbox/photographer/components/CtaStrip'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { loadSandboxPage } from '@/client/sandbox/photographer/data/load-sandbox-page'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadSandboxPage('home')
  return getSeoMetadata('/sandbox/photographer', {
    title: bundle?.page.title ?? photographerSeoDefaults.home.title,
    description: bundle?.page.excerpt ?? photographerSeoDefaults.home.description,
    ogImageUrl: bundle?.mainImageUrl ?? photographerSeoDefaults.home.ogImageUrl ?? null,
  })
}

export default async function PhotographerHome(): Promise<React.JSX.Element> {
  const bundle = await loadSandboxPage('home')
  // Hero is the only home section that benefits from CMS data in V1 — the
  // rest (Intro / FeaturedWork / QuoteStrip / CtaStrip) carry curated visual
  // copy that doesn't map to the current CMS schema.
  const heroProps = bundle
    ? {
        title: bundle.heroBlock?.title ?? bundle.page.title,
        ...(bundle.heroBlock?.subtitle !== undefined ? { tagline: bundle.heroBlock.subtitle } : {}),
        ...(bundle.heroImageUrl !== null ? { imageUrl: bundle.heroImageUrl } : {}),
        ...(bundle.mainImageAlt !== '' ? { imageAlt: bundle.mainImageAlt } : {}),
      }
    : {}
  return (
    <>
      <Hero {...heroProps} />
      <Intro />
      <FeaturedWork />
      <QuoteStrip />
      <CtaStrip />
    </>
  )
}
