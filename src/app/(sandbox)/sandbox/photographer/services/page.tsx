import type React from 'react'
import type { Metadata } from 'next'
import { ServicesList } from '@/client/sandbox/photographer/components/ServicesList'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata('/sandbox/photographer/services', photographerSeoDefaults.services)
}

export default function PhotographerServices(): React.JSX.Element {
  return <ServicesList />
}
