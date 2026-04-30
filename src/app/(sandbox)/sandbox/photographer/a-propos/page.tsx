import type React from 'react'
import type { Metadata } from 'next'
import { AboutBody } from '@/client/sandbox/photographer/components/AboutBody'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { loadSandboxPage } from '@/client/sandbox/photographer/data/load-sandbox-page'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadSandboxPage('about')
  return getSeoMetadata('/sandbox/photographer/a-propos', {
    title: bundle?.page.title ?? photographerSeoDefaults.about.title,
    description: bundle?.page.excerpt ?? photographerSeoDefaults.about.description,
    ogImageUrl: bundle?.mainImageUrl ?? photographerSeoDefaults.about.ogImageUrl ?? null,
  })
}

export default async function PhotographerAbout(): Promise<React.JSX.Element> {
  const bundle = await loadSandboxPage('about')
  // Each Text block in the CMS page becomes one paragraph in the About body.
  // If the page has no text blocks but a `content` field, we synthesize one
  // paragraph so legacy pages still get their copy through.
  const paragraphs =
    bundle === null
      ? undefined
      : bundle.textBlocks.length > 0
        ? bundle.textBlocks.map((b) => b.body)
        : bundle.page.content !== ''
          ? [bundle.page.content]
          : undefined
  const props = bundle
    ? {
        title: bundle.page.title,
        ...(bundle.mainImageUrl !== null ? { portraitUrl: bundle.mainImageUrl } : {}),
        ...(bundle.mainImageAlt !== '' ? { portraitAlt: bundle.mainImageAlt } : {}),
        ...(paragraphs !== undefined ? { paragraphs } : {}),
      }
    : {}
  return <AboutBody {...props} />
}
