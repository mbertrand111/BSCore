import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type IconSize = 'sm' | 'md' | 'lg'

/**
 * Sizing wrapper for an icon. The caller passes the actual SVG (inline or
 * from a library) as children. This keeps the primitive lib free of an
 * icon dependency until the project picks one (FRONTEND.md OQ — not yet
 * resolved).
 *
 * Decorative icons should be wrapped with `decorative` (sets aria-hidden).
 * Meaningful icons must receive an `aria-label` on the parent button or
 * provide accessible text alongside.
 */
export interface IconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  size?: IconSize
  decorative?: boolean
  children: React.ReactNode
}

const SIZE_CLASSES: Record<IconSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function Icon({
  size = 'md',
  decorative = true,
  className,
  children,
  ...rest
}: IconProps): React.JSX.Element {
  return (
    <span
      aria-hidden={decorative ? 'true' : undefined}
      className={cn('inline-flex shrink-0 items-center justify-center', SIZE_CLASSES[size], className)}
      {...rest}
    >
      {children}
    </span>
  )
}
