import type React from 'react'
import { notFound } from 'next/navigation'
import { AdminPageHeader, AdminSection } from '@/shared/ui/admin'
import { Badge } from '@/shared/ui/primitives'
import { getMediaAssetById } from '@/modules/media/data/repository'
import { MediaEditAltForm } from '@/modules/media/components/MediaEditAltForm'
import { MediaDeleteButton } from '@/modules/media/components/MediaDeleteButton'

interface EditMediaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMediaPage({
  params,
}: EditMediaPageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const asset = await getMediaAssetById(id)
  if (asset === null) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <AdminPageHeader
        title={asset.originalFilename}
        description="Update the alt text or delete this asset."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Media', href: '/admin/media' },
          { label: asset.originalFilename },
        ]}
      />

      <AdminSection title="Preview">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="h-40 w-40 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {asset.publicUrl !== '' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.publicUrl}
                alt={asset.altText || asset.originalFilename}
                className="h-full w-full object-cover"
                width={160}
                height={160}
              />
            ) : null}
          </div>
          <dl className="grid flex-1 grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-fg">Type</dt>
            <dd>
              <Badge intent="neutral">{asset.mimeType}</Badge>
            </dd>
            <dt className="text-muted-fg">Size</dt>
            <dd className="font-mono text-xs">{asset.sizeBytes} bytes</dd>
            <dt className="text-muted-fg">Storage path</dt>
            <dd className="break-all font-mono text-xs">{asset.storagePath}</dd>
            <dt className="text-muted-fg">Public URL</dt>
            <dd className="break-all">
              {asset.publicUrl !== '' ? (
                <a
                  href={asset.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {asset.publicUrl}
                </a>
              ) : (
                <span className="text-xs italic text-muted-fg">SUPABASE_URL not set</span>
              )}
            </dd>
            <dt className="text-muted-fg">Uploaded</dt>
            <dd className="text-xs">
              <time dateTime={asset.createdAt.toISOString()}>
                {asset.createdAt.toLocaleString()}
              </time>
            </dd>
          </dl>
        </div>
      </AdminSection>

      <AdminSection title="Alt text">
        <MediaEditAltForm asset={asset} />
      </AdminSection>

      <AdminSection title="Danger zone">
        <p className="mb-3 text-sm text-muted-fg">
          Deletes the row from the database and removes the blob from Supabase Storage. This
          cannot be undone.
        </p>
        <MediaDeleteButton id={asset.id} filename={asset.originalFilename} />
      </AdminSection>
    </div>
  )
}
