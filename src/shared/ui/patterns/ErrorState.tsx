import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** User-facing title — keep generic, never expose driver / stack details. */
  title?: string
  /** User-facing message — keep generic. The real error belongs in server logs. */
  description?: string
  /** Optional retry / recovery action — typically a <Button>. */
  action?: React.ReactNode
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
  className,
  ...rest
}: ErrorStateProps): React.JSX.Element {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
      {...rest}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description !== undefined ? (
        <p className="max-w-md text-xs text-muted-fg">{description}</p>
      ) : null}
      {action !== undefined ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
