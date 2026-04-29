import type React from 'react'
import { AdminPageHeader } from '@/shared/ui/admin'
import { listMediaAssets } from '@/modules/media/data/repository'
import { CmsPageForm } from '@/modules/cms/components/CmsPageForm'

export default async function NewCmsPagePage(): Promise<React.JSX.Element> {
  const mediaAssets = await listMediaAssets()
  const mediaOptions = mediaAssets.map((m) => ({
    id: m.id,
    originalFilename: m.originalFilename,
  }))

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title="New CMS page"
        description="Create a page. Save as draft to keep it hidden, or publish to expose it at /[slug]."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'CMS', href: '/admin/cms' },
          { label: 'New' },
        ]}
      />
      <CmsPageForm mode="create" mediaOptions={mediaOptions} />
    </div>
  )
}
