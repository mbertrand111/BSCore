import type React from 'react'
import Link from 'next/link'
import { listSeoEntries, type SeoEntry } from '@/modules/seo/data/repository'
import { AdminPageHeader, AdminEmptyState } from '@/shared/ui/admin'
import { Badge, Button } from '@/shared/ui/primitives'
import { DataTable, type DataTableColumn } from '@/shared/ui/patterns'

const COLUMNS: ReadonlyArray<DataTableColumn<SeoEntry>> = [
  {
    key: 'route',
    label: 'Route',
    render: (e) => <code className="font-mono text-xs">{e.route}</code>,
  },
  { key: 'title', label: 'Titre', accessor: 'title' },
  {
    key: 'robots',
    label: 'Robots',
    render: (e) => (
      <div className="flex flex-wrap gap-1">
        <Badge intent={e.robotsIndex ? 'success' : 'danger'}>
          {e.robotsIndex ? 'index' : 'noindex'}
        </Badge>
        <Badge intent={e.robotsFollow ? 'success' : 'danger'}>
          {e.robotsFollow ? 'follow' : 'nofollow'}
        </Badge>
      </div>
    ),
  },
  {
    key: 'updatedAt',
    label: 'Modifiée',
    render: (e) => (
      <time
        dateTime={e.updatedAt.toISOString()}
        className="text-xs text-muted-fg"
      >
        {e.updatedAt.toLocaleDateString('fr-FR')}
      </time>
    ),
  },
  {
    key: 'actions',
    label: '',
    render: (e) => (
      <Link
        href={`/admin/seo/${e.id}`}
        className="text-xs font-medium text-primary hover:underline"
      >
        Modifier
      </Link>
    ),
  },
]

export default async function SeoListPage(): Promise<React.JSX.Element> {
  const entries = await listSeoEntries()

  return (
    <div>
      <AdminPageHeader
        title="Entrées SEO"
        description="Métadonnées par route qui surchargent les valeurs SEO par défaut de la plateforme."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'SEO' }]}
        action={
          <Link href="/admin/seo/new">
            <Button intent="primary">Nouvelle entrée</Button>
          </Link>
        }
      />

      {entries.length === 0 ? (
        <AdminEmptyState
          title="Aucune entrée SEO pour l'instant"
          description="Ajoutez une entrée par route pour surcharger les métadonnées par défaut (titre, description, OG, canonique, robots)."
          action={
            <Link href="/admin/seo/new">
              <Button intent="primary">Créer la première entrée</Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          testId="seo-entries-table"
          columns={COLUMNS}
          rows={entries}
          rowId={(e) => e.id}
        />
      )}
    </div>
  )
}
