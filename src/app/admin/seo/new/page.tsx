import type React from 'react'
import { AdminPageHeader } from '@/shared/ui/admin'
import { SeoForm } from '@/modules/seo/components/SeoForm'

export default function NewSeoEntryPage(): React.JSX.Element {
  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title="New SEO entry"
        description="Override the platform SEO baseline for a specific route."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'SEO', href: '/admin/seo' },
          { label: 'New' },
        ]}
      />
      <SeoForm mode="create" />
    </div>
  )
}
