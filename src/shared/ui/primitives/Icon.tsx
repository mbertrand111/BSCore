import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type IconSize = 'sm' | 'md' | 'lg'

/**
 * Sizing wrapper for an icon. The caller passes the actual icon as children
 * — typically a lucide-react component, but any SVG works.
 *
 *   import { Check } from 'lucide-react'
 *   <Icon size="sm"><Check /></Icon>
 *
 * Decorative icons get aria-hidden by default. For meaningful icons set
 * `decorative={false}` and pair with an aria-label on the parent button or
 * provide accessible text alongside.
 */
export interface IconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  size?: IconSize
  decorative?: boolean
  children: React.ReactNode
}

const SIZE_CLASSES: Record<IconSize, string> = {
  sm: 'h-4 w-4 [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-5 w-5 [&_svg]:h-5 [&_svg]:w-5',
  lg: 'h-6 w-6 [&_svg]:h-6 [&_svg]:w-6',
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
