import type { Metadata } from 'next'
import './globals.css'

// Root layout: HTML shell only.
// No business logic, no database, no auth.
// See: docs/REPOSITORY_STRUCTURE.md — src/app/ is routing/layout only.
export const metadata: Metadata = {
  title: {
    template: '%s | BSCore',
    default: 'BSCore',
  },
  description: 'BSCore — reusable web platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
