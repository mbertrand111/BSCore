import type React from 'react'
import type { ReactNode } from 'react'
import type { AuthenticatedUser } from '@/socle-plus/auth/auth.types'
import { getAdminNav } from '../admin-nav-registry'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  user: AuthenticatedUser
  children: ReactNode
}

export function AdminLayout({ user, children }: AdminLayoutProps): React.JSX.Element {
  const navItems = getAdminNav(user)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar items={navItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
