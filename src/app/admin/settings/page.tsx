import type React from 'react'
import { AdminComingSoon, AdminPageHeader } from '@/shared/ui/admin'

export default function AdminSettingsPage(): React.JSX.Element {
  return (
    <div>
      <AdminPageHeader
        title="Réglages"
        description="Configuration du site : nom, langue, branding, intégrations."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Réglages' }]}
      />
      <AdminComingSoon message="Cette section centralisera bientôt les réglages globaux : nom du site, tagline, logo, langue par défaut, intégrations tierces. Pour l'instant, ces valeurs sont configurées dans src/client/config/branding.config.ts." />
    </div>
  )
}
