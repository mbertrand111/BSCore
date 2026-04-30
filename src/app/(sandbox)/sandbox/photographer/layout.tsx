import type React from 'react'
import type { ReactNode } from 'react'
import { Inter, Playfair_Display } from 'next/font/google'
import { SiteHeader } from '@/client/sandbox/photographer/components/SiteHeader'
import { SiteFooter } from '@/client/sandbox/photographer/components/SiteFooter'
import '@/client/sandbox/photographer/styles.css'

/**
 * Layout for the photographer sandbox.
 *
 * Why a dedicated layout:
 *   - Loads Playfair Display + Inter via next/font/google ONLY for sandbox
 *     routes — they don't ship on /admin or any other page.
 *   - Wraps every sandbox page with the `.photographer-theme` class so the
 *     scoped CSS (src/client/sandbox/photographer/styles.css) only applies
 *     to this isolated route group.
 *   - Provides the public site shell (header + footer) without inheriting
 *     the BSCore admin shell. The sandbox is a completely separate visual
 *     surface from /admin/*.
 *
 * The fonts expose CSS variables that the scoped stylesheet picks up via
 * `var(--font-photographer-display)` / `var(--font-photographer-body)`.
 */

/**
 * Force dynamic rendering on every sandbox page.
 *
 * The pages call `getSeoMetadata()` which queries the database. Static
 * prerender at build time fails when the DB is unreachable. Marking the
 * layout dynamic propagates to all sandbox sub-routes — same pattern as
 * /admin/* (cookies-based) and /[slug] (DB-bound).
 */
export const dynamic = 'force-dynamic'

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-photographer-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-photographer-body',
  display: 'swap',
})

export default function PhotographerSandboxLayout({
  children,
}: {
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className={`photographer-theme ${playfair.variable} ${inter.variable}`}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}
