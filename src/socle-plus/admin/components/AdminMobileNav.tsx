'use client'

import { useState } from 'react'
import type React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Menu, X } from 'lucide-react'
import type { AuthenticatedUser } from '@/socle-plus/auth/auth.types'
import type { AdminNavGroup } from '../admin.types'
import { AdminBranding, AdminPlatformAttribution } from './AdminBranding'
import { AdminNavSection } from './AdminNavSection'
import { AdminUserCard } from './AdminUserCard'

interface AdminMobileNavProps {
  user: AuthenticatedUser
  groups: ReadonlyArray<AdminNavGroup>
}

/**
 * Mobile-only sidebar drawer.
 *
 * Renders:
 *   - A hamburger trigger that's only visible below the `md` breakpoint.
 *   - A Radix Dialog overlay + side-anchored panel containing the sidebar.
 *
 * Rendered alongside the desktop sidebar in AdminLayout — Tailwind responsive
 * classes hide the desktop sidebar on `<md` and hide this trigger on `md+`.
 *
 * Tapping a nav link closes the drawer (onNavigate prop on AdminNavSection).
 * Tapping the backdrop or pressing Escape closes via Radix Dialog defaults.
 */
export function AdminMobileNav({ user, groups }: AdminMobileNavProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const close = (): void => setOpen(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        type="button"
        aria-label="Ouvrir le menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modal bg-overlay-dark/60 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-modal flex w-72 max-w-[85vw] flex-col bg-sidebar-bg text-sidebar-fg shadow-lg focus:outline-none data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left md:hidden"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Dialog.Close
            type="button"
            aria-label="Fermer le menu"
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-muted-fg hover:bg-sidebar-active-bg hover:text-sidebar-fg"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Dialog.Close>
          <AdminBranding />
          <nav className="flex-1 overflow-y-auto py-2">
            {groups.map((group) => (
              <AdminNavSection key={group.section} group={group} onNavigate={close} />
            ))}
          </nav>
          <AdminUserCard user={user} />
          <AdminPlatformAttribution />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
