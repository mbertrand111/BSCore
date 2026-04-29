import type React from 'react'
import { notFound } from 'next/navigation'
import { AdminPageHeader, AdminSection } from '@/shared/ui/admin'
import { getCmsPageById } from '@/modules/cms/data/repository'
import { listMediaAssets } from '@/modules/media/data/repository'
import { CmsPageForm } from '@/modules/cms/components/CmsPageForm'
import { CmsDeleteButton } from '@/modules/cms/components/CmsDeleteButton'

interface EditCmsPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCmsPagePage({
  params,
}: EditCmsPageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const page = await getCmsPageById(id)
  if (page === null) notFound()

  const mediaAssets = await listMediaAssets()
  const mediaOptions = mediaAssets.map((m) => ({
    id: m.id,
    originalFilename: m.originalFilename,
  }))

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        title={page.title}
        description={`Slug: /${page.slug}`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'CMS', href: '/admin/cms' },
          { label: page.title },
        ]}
      />

      <AdminSection title="Page content">
        <CmsPageForm mode="edit" page={page} mediaOptions={mediaOptions} />
      </AdminSection>

      <AdminSection title="Danger zone">
        <p className="mb-3 text-sm text-muted-fg">
          Deletes the page from the database. The public URL will return 404 immediately. The
          main media (if any) is kept — only its reference is cleared.
        </p>
        <CmsDeleteButton id={page.id} title={page.title} />
      </AdminSection>
    </div>
  )
}
