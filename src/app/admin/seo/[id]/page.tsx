import type React from 'react'
import { notFound } from 'next/navigation'
import { AdminPageHeader } from '@/shared/ui/admin'
import { getSeoEntryById } from '@/modules/seo/data/repository'
import { SeoForm } from '@/modules/seo/components/SeoForm'

interface EditSeoPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSeoEntryPage({
  params,
}: EditSeoPageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const entry = await getSeoEntryById(id)
  if (entry === null) notFound()

  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title={`Edit ${entry.route}`}
        description="Update the SEO metadata for this route."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'SEO', href: '/admin/seo' },
          { label: entry.route },
        ]}
      />
      <SeoForm mode="edit" entry={entry} />
    </div>
  )
}
