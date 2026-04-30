import type React from 'react'
import { listMediaAssets } from '@/modules/media/data/repository'
import { CmsPageForm } from '@/modules/cms/components/CmsPageForm'

export default async function NewCmsPagePage(): Promise<React.JSX.Element> {
  const mediaAssets = await listMediaAssets()
  return <CmsPageForm mode="create" mediaAssets={mediaAssets} />
}
