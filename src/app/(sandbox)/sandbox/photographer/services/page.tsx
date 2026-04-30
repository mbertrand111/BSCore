import type React from 'react'
import type { Metadata } from 'next'
import { ServicesList } from '@/client/sandbox/photographer/components/ServicesList'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { loadSandboxPage } from '@/client/sandbox/photographer/data/load-sandbox-page'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadSandboxPage('services')
  return getSeoMetadata('/sandbox/photographer/services', {
    title: bundle?.page.title ?? photographerSeoDefaults.services.title,
    description: bundle?.page.excerpt ?? photographerSeoDefaults.services.description,
    ogImageUrl: bundle?.mainImageUrl ?? photographerSeoDefaults.services.ogImageUrl ?? null,
  })
}

export default async function PhotographerServices(): Promise<React.JSX.Element> {
  const bundle = await loadSandboxPage('services')
  const excerpt = bundle?.page.excerpt
  const props = bundle
    ? {
        title: bundle.page.title,
        ...(excerpt !== null && excerpt !== undefined && excerpt !== ''
          ? { description: excerpt }
          : {}),
      }
    : {}
  return <ServicesList {...props} />
}
