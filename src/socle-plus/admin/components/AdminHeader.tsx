import type React from 'react'
import type { AuthenticatedUser } from '@/socle-plus/auth/auth.types'

interface AdminHeaderProps {
  user: AuthenticatedUser
}

export function AdminHeader({ user }: AdminHeaderProps): React.JSX.Element {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <span className="text-sm text-foreground">{user.email}</span>
      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-fg">
        {user.role}
      </span>
    </header>
  )
}
