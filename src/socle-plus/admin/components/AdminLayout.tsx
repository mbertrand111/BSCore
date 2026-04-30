import type React from 'react'
import type { ReactNode } from 'react'
import type { AuthenticatedUser } from '@/socle-plus/auth/auth.types'
import { getGroupedAdminNav } from '../admin-nav-registry'
import { AdminHeader } from './AdminHeader'
import { AdminMobileNav } from './AdminMobileNav'
import { AdminSidebar } from './AdminSidebar'

interface AdminLayoutProps {
  user: AuthenticatedUser
  children: ReactNode
}

/**
 * Mobile-first admin shell.
 *
 *   <md           : sidebar hidden; AdminMobileNav supplies a hamburger that
 *                   opens the same nav inside a slide-in drawer.
 *   md+           : persistent sidebar to the left, content fills the rest.
 *
 * Counts are resolved server-side once via getGroupedAdminNav() and shared
 * between the desktop sidebar and the mobile drawer (no double-query).
 */
export async function AdminLayout({
  user,
  children,
}: AdminLayoutProps): Promise<React.JSX.Element> {
  const groups = await getGroupedAdminNav(user)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar user={user} groups={groups} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader>
          <AdminMobileNav user={user} groups={groups} />
        </AdminHeader>
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
