import type React from 'react'
import type { AuthenticatedUser } from '@/socle-plus/auth/auth.types'
import type { AdminNavGroup } from '../admin.types'
import { AdminBranding, AdminPlatformAttribution } from './AdminBranding'
import { AdminNavSection } from './AdminNavSection'
import { AdminUserCard } from './AdminUserCard'

interface AdminSidebarProps {
  user: AuthenticatedUser
  groups: ReadonlyArray<AdminNavGroup>
}

/**
 * Desktop sidebar. Hidden below the `md` breakpoint — on mobile, the same
 * content is rendered inside AdminMobileNav's drawer.
 *
 * Layout:
 *   - AdminBranding (client logo + name)
 *   - Sections (Vue / Modules / Système) with active state and count badges
 *   - AdminUserCard (user identity)
 *   - AdminPlatformAttribution ("Powered by Boreal Studio")
 */
export function AdminSidebar({ user, groups }: AdminSidebarProps): React.JSX.Element {
  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-fg md:flex">
      <AdminBranding />
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <AdminNavSection key={group.section} group={group} />
        ))}
      </nav>
      <AdminUserCard user={user} />
      <AdminPlatformAttribution />
    </aside>
  )
}
