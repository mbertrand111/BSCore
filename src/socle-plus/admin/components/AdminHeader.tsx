import type React from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Bell, ExternalLink, Search } from 'lucide-react'
import { branding } from '@/client/config/branding.config'
import { getSiteUrl } from '@/socle/config/site'

interface AdminHeaderProps {
  /**
   * Slot rendered on the left side of the header — typically the mobile nav
   * trigger, hidden on desktop via its own responsive classes.
   */
  children?: ReactNode
}

/**
 * Top header strip on the content side of the admin shell.
 *
 *   [hamburger]  [breadcrumb]   [search ⌘K]                [view-site] [bell]
 *
 * - **Mobile (<md)**: only the hamburger + bell are shown; the search and
 *   breadcrumb collapse out so the row stays usable on a phone.
 * - **Desktop (md+)**: full breadcrumb, a search field that opens a future
 *   command palette (placeholder for now), a "view public site" link, and
 *   the notification bell.
 *
 * Search is intentionally non-functional in V1 — clicking it focuses the
 * input but doesn't open anything yet. The visual affordance is what
 * matters here so the layout is correct when the command palette ships.
 */
export function AdminHeader({ children }: AdminHeaderProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-sticky flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:h-16 sm:px-6">
      {children}

      <nav aria-label="Fil d'ariane" className="hidden min-w-0 items-center gap-2 text-sm md:flex">
        <span className="text-muted-fg">BSCore</span>
        <span aria-hidden="true" className="text-subtle-fg">/</span>
        <span className="truncate font-medium text-foreground">{branding.clientName}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:ml-2 sm:flex-1">
        <div className="relative hidden flex-1 sm:block sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-fg"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Rechercher pages, médias…"
            className="h-9 w-full rounded-md border border-transparent bg-muted pl-9 pr-12 text-sm text-foreground placeholder:text-subtle-fg focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Rechercher"
          />
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-subtle-fg"
          >
            ⌘K
          </kbd>
        </div>

        <Link
          href={getSiteUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          aria-label="Voir le site public"
          title="Voir le site public"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>

        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
