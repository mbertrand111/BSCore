import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Visual toast component (no orchestration).
 *
 * V1 ships the visual primitive only. The provider/queue/auto-dismiss
 * orchestration is FRONTEND.md Open Question F-2 — to be resolved before
 * the first admin mutation needs feedback.
 *
 * Until then, callers render this component directly inside their own
 * controlled state (e.g. a `useState`-driven flag).
 */
export type ToastIntent = 'success' | 'error' | 'info'

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  intent?: ToastIntent
  title: string
  description?: string
}

const INTENT_CLASSES: Record<ToastIntent, string> = {
  success: 'border-success bg-success/10 text-foreground',
  error:   'border-destructive bg-destructive/10 text-foreground',
  info:    'border-info bg-info/10 text-foreground',
}

export function Toast({
  intent = 'info',
  title,
  description,
  className,
  ...rest
}: ToastProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-md border px-4 py-3 shadow-sm',
        INTENT_CLASSES[intent],
        className,
      )}
      {...rest}
    >
      <p className="text-sm font-medium">{title}</p>
      {description !== undefined ? (
        <p className="mt-1 text-xs text-muted-fg">{description}</p>
      ) : null}
    </div>
  )
}
