import type React from 'react'
import type { ReactNode } from 'react'

/**
 * Layout for unauthenticated routes (login, future password reset).
 * Lives in the (auth) route group so it sits OUTSIDE the /admin guard —
 * an unauthenticated user can actually reach this page.
 */
export default function AuthLayout({
  children,
}: {
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
