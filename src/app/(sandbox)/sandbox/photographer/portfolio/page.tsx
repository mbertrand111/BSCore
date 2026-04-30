import type React from 'react'
import type { Metadata } from 'next'
import { PortfolioGrid } from '@/client/sandbox/photographer/components/PortfolioGrid'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata('/sandbox/photographer/portfolio', photographerSeoDefaults.portfolio)
}

export default function PhotographerPortfolio(): React.JSX.Element {
  return <PortfolioGrid />
}
