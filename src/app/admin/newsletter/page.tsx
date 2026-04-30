import type React from 'react'
import { AdminComingSoon, AdminPageHeader } from '@/shared/ui/admin'

export default function AdminNewsletterPage(): React.JSX.Element {
  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        description="Listes d'abonnés, campagnes et envois programmés."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Newsletter' }]}
      />
      <AdminComingSoon message="Le module Newsletter ajoutera la gestion des listes, la composition de campagnes et l'intégration avec un fournisseur d'envoi (Resend, Brevo, Postmark)." />
    </div>
  )
}
