import type React from 'react'
import { AdminComingSoon, AdminPageHeader } from '@/shared/ui/admin'

export default function AdminUsersPage(): React.JSX.Element {
  return (
    <div>
      <AdminPageHeader
        title="Utilisateurs"
        description="Gestion des comptes, des rôles et des invitations."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Utilisateurs' }]}
      />
      <AdminComingSoon message="Cette section permettra bientôt d'inviter, modifier et révoquer les utilisateurs de l'espace, et de gérer leurs rôles. Les comptes existants continuent à fonctionner via Supabase Auth." />
    </div>
  )
}
