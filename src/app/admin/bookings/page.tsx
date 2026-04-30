import type React from 'react'
import { AdminComingSoon, AdminPageHeader } from '@/shared/ui/admin'

export default function AdminBookingsPage(): React.JSX.Element {
  return (
    <div>
      <AdminPageHeader
        title="Réservations"
        description="Créneaux, demandes clients et calendrier de prestation."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Réservations' }]}
      />
      <AdminComingSoon message="Le module Réservations permettra aux clients de demander un créneau depuis le site et au studio de confirmer, déplacer ou refuser ces demandes depuis ce backoffice." />
    </div>
  )
}
