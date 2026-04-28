import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string
  description?: string
  /** Optional icon node (already sized via <Icon />). */
  icon?: React.ReactNode
  /** Optional CTA — typically a <Button>. */
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...rest
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-6 py-12 text-center',
        className,
      )}
      {...rest}
    >
      {icon !== undefined ? <div className="text-muted-fg">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description !== undefined ? (
        <p className="max-w-md text-xs text-muted-fg">{description}</p>
      ) : null}
      {action !== undefined ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
