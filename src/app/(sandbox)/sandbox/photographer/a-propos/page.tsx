import type React from 'react'
import type { Metadata } from 'next'
import { AboutBody } from '@/client/sandbox/photographer/components/AboutBody'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata('/sandbox/photographer/a-propos', photographerSeoDefaults.about)
}

export default function PhotographerAbout(): React.JSX.Element {
  return <AboutBody />
}
