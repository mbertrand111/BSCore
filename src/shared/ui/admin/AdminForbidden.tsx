import type React from 'react'
import { ErrorState } from '@/shared/ui/patterns/ErrorState'

/**
 * Display-only "you don't have access" notice for admin views.
 * The real authorization check is server-side — this component just renders
 * the resulting state. Never use this as a security control.
 */
export interface AdminForbiddenProps {
  title?: string
  description?: string
  /** Optional recovery action — typically "Back to dashboard". */
  action?: React.ReactNode
  className?: string
}

export function AdminForbidden({
  title = 'Access denied',
  description = 'You do not have permission to view this page.',
  action,
  className,
}: AdminForbiddenProps): React.JSX.Element {
  return (
    <ErrorState
      title={title}
      description={description}
      {...(action !== undefined ? { action } : {})}
      {...(className !== undefined ? { className } : {})}
      data-testid="admin-forbidden"
    />
  )
}
