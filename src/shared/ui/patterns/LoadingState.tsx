import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'
import { Spinner } from '@/shared/ui/primitives/Spinner'

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visible label next to the spinner. */
  label?: string
}

export function LoadingState({
  label = 'Loading…',
  className,
  ...rest
}: LoadingStateProps): React.JSX.Element {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-12 text-muted-fg',
        className,
      )}
      {...rest}
    >
      <Spinner size="md" label={label} />
      <span className="text-sm">{label}</span>
    </div>
  )
}
