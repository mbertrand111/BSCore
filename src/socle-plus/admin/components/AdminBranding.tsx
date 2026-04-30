import type React from 'react'
import { branding } from '@/client/config/branding.config'

/**
 * Sidebar header — gradient "B" platform mark + BSCore wordmark + client
 * subtitle. Two pieces of identity coexist:
 *   - "BSCore" asserts the platform (the chrome's lineage)
 *   - "<clientName> · <tagline>" asserts whose workspace this is
 *
 * Layout mirrors the BSCore Backoffice maquette: a 34×34 rounded gradient
 * tile with a single "B" glyph, then a stacked text block.
 */
export function AdminBranding(): React.JSX.Element {
  const tagline = branding.clientTagline.trim()
  const subtitle = tagline.length > 0 ? `${branding.clientName} · ${tagline}` : branding.clientName
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary font-heading text-base font-bold text-accent-fg shadow-md"
        aria-hidden="true"
      >
        B
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-sidebar-fg">BSCore</p>
        <p className="truncate text-[10px] uppercase tracking-[0.18em] text-sidebar-muted-fg">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

/**
 * Discreet platform attribution at the bottom of the sidebar — visible but
 * never competing with the client brand. Hardcoded; not configurable.
 */
export function AdminPlatformAttribution(): React.JSX.Element {
  return (
    <div className="px-5 py-3 text-[10px] uppercase tracking-[0.32em] text-sidebar-muted-fg/60">
      Powered by Boreal Studio
    </div>
  )
}
