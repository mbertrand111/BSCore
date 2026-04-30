import type React from 'react'
import { listCmsPages, type CmsPage } from '@/modules/cms/data/repository'
import { CmsPagesTable } from '@/modules/cms/components/CmsPagesTable'

export default async function CmsListPage(): Promise<React.JSX.Element> {
  const pages: ReadonlyArray<CmsPage> = await listCmsPages()
  return <CmsPagesTable pages={pages} />
}
