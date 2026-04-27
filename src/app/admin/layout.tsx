import type React from 'react'
import type { ReactNode } from 'react'
import { requireAdminAuth } from '@/socle-plus/admin'
import { AdminLayout } from '@/socle-plus/admin'

export default async function AdminRootLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const user = await requireAdminAuth()
  return <AdminLayout user={user}>{children}</AdminLayout>
}
