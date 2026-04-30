import type React from 'react'
import type { Metadata } from 'next'
import { Hero } from '@/client/sandbox/photographer/components/Hero'
import { Intro } from '@/client/sandbox/photographer/components/Intro'
import { FeaturedWork } from '@/client/sandbox/photographer/components/FeaturedWork'
import { QuoteStrip } from '@/client/sandbox/photographer/components/QuoteStrip'
import { CtaStrip } from '@/client/sandbox/photographer/components/CtaStrip'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata('/sandbox/photographer', photographerSeoDefaults.home)
}

export default function PhotographerHome(): React.JSX.Element {
  return (
    <>
      <Hero />
      <Intro />
      <FeaturedWork />
      <QuoteStrip />
      <CtaStrip />
    </>
  )
}
