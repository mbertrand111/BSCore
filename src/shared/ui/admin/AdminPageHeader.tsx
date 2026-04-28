import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Mandatory at the top of every admin page (FRONTEND.md §7).
 * Composition only — no admin-specific tokens or styles.
 */
export interface AdminPageHeaderProps {
  title: string
  description?: string
  /** Breadcrumb trail rendered above the title. */
  breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>
  /** Right-aligned action slot — typically a primary <Button>. */
  action?: React.ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  action,
  className,
}: AdminPageHeaderProps): React.JSX.Element {
  return (
    <header className={cn('mb-6 flex flex-col gap-3', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-fg">
            {breadcrumbs.map((crumb, idx) => (
              <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1">
                {crumb.href !== undefined ? (
                  <a href={crumb.href} className="hover:text-foreground">
                    {crumb.label}
                  </a>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {description !== undefined ? (
            <p className="mt-1 text-sm text-muted-fg">{description}</p>
          ) : null}
        </div>
        {action !== undefined ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  )
}
