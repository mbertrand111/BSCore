import type React from 'react'
import Link from 'next/link'
import { listMediaAssets, type MediaAsset } from '@/modules/media/data/repository'
import { AdminPageHeader, AdminEmptyState } from '@/shared/ui/admin'
import { Badge, Button } from '@/shared/ui/primitives'
import { DataTable, type DataTableColumn } from '@/shared/ui/patterns'

const COLUMNS: ReadonlyArray<DataTableColumn<MediaAsset>> = [
  {
    key: 'preview',
    label: '',
    render: (a) => (
      <div className="h-12 w-12 overflow-hidden rounded-md border border-border bg-muted">
        {a.publicUrl !== '' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.publicUrl}
            alt={a.altText || a.originalFilename}
            className="h-full w-full object-cover"
            loading="lazy"
            width={48}
            height={48}
          />
        ) : null}
      </div>
    ),
  },
  {
    key: 'originalFilename',
    label: 'Filename',
    render: (a) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{a.originalFilename}</span>
        {a.altText !== '' ? (
          <span className="text-xs text-muted-fg" title={a.altText}>
            {truncate(a.altText, 60)}
          </span>
        ) : (
          <span className="text-xs italic text-muted-fg">No alt text</span>
        )}
      </div>
    ),
  },
  {
    key: 'mimeType',
    label: 'Type',
    render: (a) => <Badge intent="neutral">{a.mimeType.replace('image/', '')}</Badge>,
  },
  {
    key: 'sizeBytes',
    label: 'Size',
    render: (a) => (
      <span className="font-mono text-xs text-muted-fg">{formatSize(a.sizeBytes)}</span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Uploaded',
    render: (a) => (
      <time dateTime={a.createdAt.toISOString()} className="text-xs text-muted-fg">
        {a.createdAt.toLocaleDateString()}
      </time>
    ),
  },
  {
    key: 'actions',
    label: '',
    render: (a) => (
      <Link
        href={`/admin/media/${a.id}`}
        className="text-xs font-medium text-primary hover:underline"
      >
        Edit
      </Link>
    ),
  },
]

export default async function MediaListPage(): Promise<React.JSX.Element> {
  const assets = await listMediaAssets()

  return (
    <div>
      <AdminPageHeader
        title="Media"
        description="Uploaded images stored in Supabase Storage."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Media' }]}
        action={
          <Link href="/admin/media/new">
            <Button intent="primary">Upload</Button>
          </Link>
        }
      />

      {assets.length === 0 ? (
        <AdminEmptyState
          title="No media uploaded yet"
          description="Upload your first image to get started."
          action={
            <Link href="/admin/media/new">
              <Button intent="primary">Upload an image</Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          testId="media-assets-table"
          columns={COLUMNS}
          rows={assets}
          rowId={(a) => a.id}
        />
      )}
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}
