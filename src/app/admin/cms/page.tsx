import type React from 'react'
import Link from 'next/link'
import { listCmsPages, type CmsPage } from '@/modules/cms/data/repository'
import { AdminPageHeader, AdminEmptyState } from '@/shared/ui/admin'
import { Badge, Button } from '@/shared/ui/primitives'
import { DataTable, type DataTableColumn } from '@/shared/ui/patterns'

const COLUMNS: ReadonlyArray<DataTableColumn<CmsPage>> = [
  {
    key: 'title',
    label: 'Title',
    render: (p) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{p.title}</span>
        <code className="font-mono text-xs text-muted-fg">/{p.slug}</code>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (p) => (
      <Badge intent={p.status === 'published' ? 'success' : 'neutral'}>{p.status}</Badge>
    ),
  },
  {
    key: 'updatedAt',
    label: 'Last updated',
    render: (p) => (
      <time dateTime={p.updatedAt.toISOString()} className="text-xs text-muted-fg">
        {p.updatedAt.toLocaleDateString()}
      </time>
    ),
  },
  {
    key: 'publishedAt',
    label: 'Published',
    render: (p) =>
      p.publishedAt !== null ? (
        <time dateTime={p.publishedAt.toISOString()} className="text-xs text-muted-fg">
          {p.publishedAt.toLocaleDateString()}
        </time>
      ) : (
        <span className="text-xs italic text-muted-fg">—</span>
      ),
  },
  {
    key: 'actions',
    label: '',
    render: (p) => (
      <Link
        href={`/admin/cms/${p.id}`}
        className="text-xs font-medium text-primary hover:underline"
      >
        Edit
      </Link>
    ),
  },
]

export default async function CmsListPage(): Promise<React.JSX.Element> {
  const pages = await listCmsPages()

  return (
    <div>
      <AdminPageHeader
        title="CMS pages"
        description="Pages managed by the CMS module. Published pages are visible at /[slug]."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'CMS' }]}
        action={
          <Link href="/admin/cms/new">
            <Button intent="primary">New page</Button>
          </Link>
        }
      />

      {pages.length === 0 ? (
        <AdminEmptyState
          title="No pages yet"
          description="Create your first CMS page to get started. Drafts stay private; published pages appear at /[slug]."
          action={
            <Link href="/admin/cms/new">
              <Button intent="primary">Create the first page</Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          testId="cms-pages-table"
          columns={COLUMNS}
          rows={pages}
          rowId={(p) => p.id}
        />
      )}
    </div>
  )
}
