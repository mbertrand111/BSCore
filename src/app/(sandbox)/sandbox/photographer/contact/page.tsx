import type React from 'react'
import type { Metadata } from 'next'
import { ContactPanel } from '@/client/sandbox/photographer/components/ContactPanel'
import { photographerSeoDefaults } from '@/client/sandbox/photographer/content/site-content'
import { getSeoMetadata } from '@/modules/seo'

export async function generateMetadata(): Promise<Metadata> {
  return getSeoMetadata('/sandbox/photographer/contact', photographerSeoDefaults.contact)
}

export default function PhotographerContact(): React.JSX.Element {
  return <ContactPanel />
}
