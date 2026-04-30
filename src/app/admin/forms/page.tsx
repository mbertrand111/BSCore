import type React from 'react'
import { AdminComingSoon, AdminPageHeader } from '@/shared/ui/admin'

export default function AdminFormsPage(): React.JSX.Element {
  return (
    <div>
      <AdminPageHeader
        title="Formulaires"
        description="Constructeur de formulaires et boîte de réception des soumissions."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Formulaires' }]}
      />
      <AdminComingSoon message="Le module Formulaires permettra de composer des formulaires (contact, devis, candidature) en glisser-déposer, de stocker les soumissions et d'envoyer une notification email à chaque nouvelle entrée." />
    </div>
  )
}
