import type React from 'react'
import type { Metadata } from 'next'
import { ContactPanel } from '@/client/sandbox/photographer/components/ContactPanel'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { loadSandboxPage } from '@/client/sandbox/photographer/data/load-sandbox-page'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadSandboxPage('contact')
  return getSeoMetadata('/sandbox/photographer/contact', {
    title: bundle?.page.title ?? photographerSeoDefaults.contact.title,
    description: bundle?.page.excerpt ?? photographerSeoDefaults.contact.description,
    ogImageUrl: bundle?.mainImageUrl ?? photographerSeoDefaults.contact.ogImageUrl ?? null,
  })
}

export default async function PhotographerContact(): Promise<React.JSX.Element> {
  const bundle = await loadSandboxPage('contact')
  const excerpt = bundle?.page.excerpt
  const props = bundle
    ? {
        title: bundle.page.title,
        ...(excerpt !== null && excerpt !== undefined && excerpt !== ''
          ? { intro: excerpt }
          : {}),
      }
    : {}
  return <ContactPanel {...props} />
}
