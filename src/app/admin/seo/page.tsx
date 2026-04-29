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
  { key: 'title', label: 'Title', accessor: 'title' },
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
    label: 'Last updated',
    render: (e) => (
      <time
        dateTime={e.updatedAt.toISOString()}
        className="text-xs text-muted-fg"
      >
        {e.updatedAt.toLocaleDateString()}
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
        Edit
      </Link>
    ),
  },
]

export default async function SeoListPage(): Promise<React.JSX.Element> {
  const entries = await listSeoEntries()

  return (
    <div>
      <AdminPageHeader
        title="SEO entries"
        description="Per-route metadata that overrides the platform SEO baseline."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'SEO' }]}
        action={
          <Link href="/admin/seo/new">
            <Button intent="primary">New entry</Button>
          </Link>
        }
      />

      {entries.length === 0 ? (
        <AdminEmptyState
          title="No SEO entries yet"
          description="Add a per-route entry to override the platform SEO baseline (title, description, OG, canonical, robots)."
          action={
            <Link href="/admin/seo/new">
              <Button intent="primary">Create the first entry</Button>
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
