import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Loading placeholder shaped like the eventual content.
 * Use width/height utility classes (or className) to size it — the default
 * is a single text-line placeholder.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When true, renders as inline-block. Default is block. */
  inline?: boolean
}

export function Skeleton({
  inline = false,
  className,
  ...rest
}: SkeletonProps): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-sm bg-muted',
        inline ? 'inline-block h-4 w-24 align-middle' : 'block h-4 w-full',
        className,
      )}
      {...rest}
    />
  )
}
