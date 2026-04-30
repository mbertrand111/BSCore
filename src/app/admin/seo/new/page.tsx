import type React from 'react'
import { AdminPageHeader } from '@/shared/ui/admin'
import { SeoForm } from '@/modules/seo/components/SeoForm'

export default function NewSeoEntryPage(): React.JSX.Element {
  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title="Nouvelle entrée SEO"
        description="Surcharge les métadonnées SEO par défaut pour une route précise."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'SEO', href: '/admin/seo' },
          { label: 'Nouvelle' },
        ]}
      />
      <SeoForm mode="create" />
    </div>
  )
}
