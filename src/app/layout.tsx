import type { Metadata } from 'next'
import { ToastProvider } from '@/shared/ui/patterns/Toast'
import { TooltipProvider } from '@/shared/ui/patterns/Tooltip'
import { getSiteUrl, getSiteUrlObject } from '@/socle/config/site'
// Side-effect import: activates enabled modules (registerAdminNav, declarePermissions).
// See src/app/_boot.ts for details.
import './_boot'
import './globals.css'

// Root layout: HTML shell only.
// No business logic, no database, no auth.
// See: docs/REPOSITORY_STRUCTURE.md — src/app/ is routing/layout only.
//
// SEO baseline (per docs/SEO_RULES.md §1 "Baseline Socle"):
//   - metadataBase resolved from NEXT_PUBLIC_APP_URL → public origin
//   - title template + description default
//   - OG + Twitter fallback for shared links
//   - robots default = index/follow (private routes opt-out per page)
// Per-page overrides (e.g. /admin, /login, /dev/ui-preview) set their own
// `metadata.robots` to noindex.

const SITE_NAME = 'BSCore'
const DEFAULT_DESCRIPTION = 'BSCore — reusable web platform.'

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'fr_FR',
    url: getSiteUrl(),
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="fr">
      <body>
        <TooltipProvider>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
