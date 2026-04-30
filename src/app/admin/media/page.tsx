import type React from 'react'
import { listMediaAssets } from '@/modules/media/data/repository'
import {
  listMediaFoldersWithCounts,
  getMediaFolderBySlug,
} from '@/modules/media/data/folders-repository'
import { MediaLibrary } from '@/modules/media/components/MediaLibrary'

interface MediaListPageProps {
  // Next 15 promises searchParams to support streaming. Slug is the
  // canonical filter key — `__none__` is a sentinel for "Non classés".
  searchParams: Promise<{ folder?: string }>
}

export default async function MediaListPage({
  searchParams,
}: MediaListPageProps): Promise<React.JSX.Element> {
  const { folder: folderSlug } = await searchParams

  // Resolve the folder filter:
  //   undefined / missing → all assets
  //   '__none__'           → only unclassified
  //   slug                 → only that folder
  //   unknown slug         → silently fall back to all (URL stays stable)
  let assetFilter: string | null | undefined = undefined
  let activeFolderId: string | null | undefined = undefined
  let activeFolderName: string | null = null
  let activeFolderDescription: string | null = null
  if (folderSlug === '__none__') {
    assetFilter = null
    activeFolderId = null
  } else if (folderSlug !== undefined && folderSlug !== '') {
    const folder = await getMediaFolderBySlug(folderSlug)
    if (folder !== null) {
      assetFilter = folder.id
      activeFolderId = folder.id
      activeFolderName = folder.name
      activeFolderDescription = folder.description
    }
  }

  const [foldersData, assets] = await Promise.all([
    listMediaFoldersWithCounts(),
    listMediaAssets(assetFilter),
  ])

  return (
    <MediaLibrary
      assets={assets}
      folders={foldersData.folders}
      unclassifiedCount={foldersData.unclassifiedCount}
      totalCount={foldersData.totalCount}
      activeFolderId={activeFolderId}
      activeFolderName={activeFolderName}
      activeFolderDescription={activeFolderDescription}
    />
  )
}
