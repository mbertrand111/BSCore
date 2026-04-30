import type React from 'react'
import { AdminComingSoon, AdminPageHeader } from '@/shared/ui/admin'

export default function AdminBlogPage(): React.JSX.Element {
  return (
    <div>
      <AdminPageHeader
        title="Blog"
        description="Articles, actualités et journal éditorial."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Blog' }]}
      />
      <AdminComingSoon message="Le module Blog ajoutera un éditeur d'articles avec catégories, auteurs, flux RSS et pagination. En attendant, le module CMS (Pages) couvre la création de contenus statiques." />
    </div>
  )
}
