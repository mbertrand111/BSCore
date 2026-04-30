import type React from 'react'
import type { AuthenticatedUser } from '@/socle-plus/auth/auth.types'

interface AdminUserCardProps {
  user: AuthenticatedUser
}

/**
 * Bottom-of-sidebar user card. Pink → purple gradient avatar with
 * deterministic initials, email truncated, role displayed in mono accent.
 *
 * Initials come from the email's local-part rather than a separate
 * "display name" field — until users have profiles (planned `user-profile`
 * module), the email is the only stable identifier. Two-letter glyph: first
 * letter of the first segment, first letter of the second segment if the
 * local-part has dots/dashes/underscores; otherwise the first two letters.
 */
export function AdminUserCard({ user }: AdminUserCardProps): React.JSX.Element {
  const initials = computeInitials(user.email)
  return (
    <div className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-400 text-xs font-semibold text-white"
        aria-hidden="true"
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-sidebar-fg">{user.email}</p>
        <p className="font-mono text-[11px] text-accent">{user.role}</p>
      </div>
    </div>
  )
}

function computeInitials(email: string): string {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}
