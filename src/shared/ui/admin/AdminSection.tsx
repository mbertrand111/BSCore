import type React from 'react'
import { Card } from '@/shared/ui/patterns/Card'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Bounded content section inside an admin page.
 * Composition over <Card> — adds an optional title row.
 */
export interface AdminSectionProps {
  title?: string
  description?: string
  /** Right-aligned action slot in the header (only rendered when title is set). */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function AdminSection({
  title,
  description,
  action,
  className,
  children,
}: AdminSectionProps): React.JSX.Element {
  return (
    <Card className={cn('mb-6', className)}>
      {title !== undefined ? (
        <Card.Header>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description !== undefined ? (
              <p className="mt-0.5 text-xs text-muted-fg">{description}</p>
            ) : null}
          </div>
          {action !== undefined ? <div className="shrink-0">{action}</div> : null}
        </Card.Header>
      ) : null}
      <Card.Body>{children}</Card.Body>
    </Card>
  )
}
