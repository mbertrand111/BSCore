import type React from 'react'
import { EmptyState } from '@/shared/ui/patterns/EmptyState'

/**
 * Empty list with a primary "Create" CTA.
 * Thin composition over <EmptyState> — no admin-specific styles.
 */
export interface AdminEmptyStateProps {
  title?: string
  description?: string
  /** Required CTA — admin lists always offer a way to create the missing item. */
  action: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function AdminEmptyState({
  title = 'No items yet',
  description,
  action,
  icon,
  className,
}: AdminEmptyStateProps): React.JSX.Element {
  return (
    <EmptyState
      title={title}
      {...(description !== undefined ? { description } : {})}
      {...(icon !== undefined ? { icon } : {})}
      action={action}
      {...(className !== undefined ? { className } : {})}
    />
  )
}
