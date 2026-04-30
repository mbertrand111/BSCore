import type React from 'react'
import { notFound } from 'next/navigation'
import { AdminPageHeader, AdminSection } from '@/shared/ui/admin'
import { Badge } from '@/shared/ui/primitives'
import { getMediaAssetById } from '@/modules/media/data/repository'
import { listMediaFolders } from '@/modules/media/data/folders-repository'
import { MediaEditAltForm } from '@/modules/media/components/MediaEditAltForm'
import { MediaFolderPicker } from '@/modules/media/components/MediaFolderPicker'
import { MediaDeleteButton } from '@/modules/media/components/MediaDeleteButton'

interface EditMediaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditMediaPage({
  params,
}: EditMediaPageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const [asset, folders] = await Promise.all([
    getMediaAssetById(id),
    listMediaFolders(),
  ])
  if (asset === null) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <AdminPageHeader
        title={asset.originalFilename}
        description="Modifiez le texte alternatif ou supprimez ce média."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Médias', href: '/admin/media' },
          { label: asset.originalFilename },
        ]}
      />

      <AdminSection title="Aperçu">
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
            <dt className="text-muted-fg">Taille</dt>
            <dd className="font-mono text-xs">{asset.sizeBytes} octets</dd>
            <dt className="text-muted-fg">Chemin de stockage</dt>
            <dd className="break-all font-mono text-xs">{asset.storagePath}</dd>
            <dt className="text-muted-fg">URL publique</dt>
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
                <span className="text-xs italic text-muted-fg">
                  SUPABASE_URL non configurée
                </span>
              )}
            </dd>
            <dt className="text-muted-fg">Téléversé</dt>
            <dd className="text-xs">
              <time dateTime={asset.createdAt.toISOString()}>
                {asset.createdAt.toLocaleString('fr-FR')}
              </time>
            </dd>
          </dl>
        </div>
      </AdminSection>

      <AdminSection title="Texte alternatif">
        <MediaEditAltForm asset={asset} />
      </AdminSection>

      <AdminSection title="Dossier">
        <MediaFolderPicker
          assetId={asset.id}
          currentFolderId={asset.folderId}
          folders={folders.map((f) => ({ id: f.id, name: f.name }))}
        />
      </AdminSection>

      <AdminSection title="Zone dangereuse">
        <p className="mb-3 text-sm text-muted-fg">
          Supprime la ligne de la base de données et le fichier sur Supabase Storage. Cette action
          est irréversible.
        </p>
        <MediaDeleteButton id={asset.id} filename={asset.originalFilename} />
      </AdminSection>
    </div>
  )
}
