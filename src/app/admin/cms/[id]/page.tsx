import type React from 'react'
import { notFound } from 'next/navigation'
import { getCmsPageById } from '@/modules/cms/data/repository'
import { listMediaAssets } from '@/modules/media/data/repository'
import { CmsPageForm } from '@/modules/cms/components/CmsPageForm'

interface EditCmsPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCmsPagePage({
  params,
}: EditCmsPageProps): Promise<React.JSX.Element> {
  const { id } = await params
  const page = await getCmsPageById(id)
  if (page === null) notFound()

  const mediaAssets = await listMediaAssets()

  return <CmsPageForm mode="edit" page={page} mediaAssets={mediaAssets} />
}
