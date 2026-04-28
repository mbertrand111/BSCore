import type React from 'react'
import { EmptyState } from '@/shared/ui/patterns/EmptyState'

/**
 * "Resource not found" notice for admin views.
 * Thin composition over <EmptyState> with a destructive-leaning copy.
 */
export interface AdminNotFoundProps {
  title?: string
  description?: string
  /** Optional link back — typically a <Button> linking to the parent list. */
  action?: React.ReactNode
  className?: string
}

export function AdminNotFound({
  title = 'Not found',
  description = 'The item you were looking for does not exist or has been removed.',
  action,
  className,
}: AdminNotFoundProps): React.JSX.Element {
  return (
    <EmptyState
      title={title}
      description={description}
      {...(action !== undefined ? { action } : {})}
      {...(className !== undefined ? { className } : {})}
      data-testid="admin-not-found"
    />
  )
}
