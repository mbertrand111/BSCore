import type React from 'react'
import { AdminPageHeader } from '@/shared/ui/admin'
import { getMediaFolderById } from '@/modules/media/data/folders-repository'
import { MediaUploadForm } from '@/modules/media/components/MediaUploadForm'

interface UploadMediaPageProps {
  searchParams: Promise<{ folderId?: string }>
}

export default async function UploadMediaPage({
  searchParams,
}: UploadMediaPageProps): Promise<React.JSX.Element> {
  // Optional pre-selected folder. The MediaLibrary "Téléverser" button
  // forwards the current folder context via `?folderId=<uuid>` so the
  // upload lands in the same folder by default.
  const { folderId: rawFolderId } = await searchParams
  const folder =
    rawFolderId !== undefined && rawFolderId !== ''
      ? await getMediaFolderById(rawFolderId)
      : null

  const description =
    folder !== null
      ? `Les fichiers seront classés dans « ${folder.name} » par défaut. Le texte alternatif est optionnel.`
      : "Ajoutez un ou plusieurs fichiers à la médiathèque. Le texte alternatif est optionnel — vous pouvez aussi l'éditer plus tard sur chaque média."

  const breadcrumbs =
    folder !== null
      ? [
          { label: 'Admin', href: '/admin' },
          { label: 'Médias', href: '/admin/media' },
          {
            label: folder.name,
            href: `/admin/media?folder=${encodeURIComponent(folder.slug)}`,
          },
          { label: 'Téléverser' },
        ]
      : [
          { label: 'Admin', href: '/admin' },
          { label: 'Médias', href: '/admin/media' },
          { label: 'Téléverser' },
        ]

  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title="Téléverser des médias"
        description={description}
        breadcrumbs={breadcrumbs}
      />
      <MediaUploadForm
        {...(folder !== null
          ? { defaultFolderId: folder.id, defaultFolderName: folder.name }
          : {})}
      />
    </div>
  )
}
