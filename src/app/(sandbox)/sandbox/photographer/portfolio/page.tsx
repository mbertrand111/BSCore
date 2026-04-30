import type React from 'react'
import type { Metadata } from 'next'
import { PortfolioGrid } from '@/client/sandbox/photographer/components/PortfolioGrid'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { loadSandboxPage } from '@/client/sandbox/photographer/data/load-sandbox-page'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadSandboxPage('portfolio')
  return getSeoMetadata('/sandbox/photographer/portfolio', {
    title: bundle?.page.title ?? photographerSeoDefaults.portfolio.title,
    description: bundle?.page.excerpt ?? photographerSeoDefaults.portfolio.description,
    ogImageUrl: bundle?.mainImageUrl ?? photographerSeoDefaults.portfolio.ogImageUrl ?? null,
  })
}

export default async function PhotographerPortfolio(): Promise<React.JSX.Element> {
  const bundle = await loadSandboxPage('portfolio')
  const props = bundle
    ? {
        title: bundle.page.title,
        ...(bundle.galleryItems.length > 0
          ? { cmsImages: bundle.galleryItems }
          : {}),
      }
    : {}
  return <PortfolioGrid {...props} />
}
