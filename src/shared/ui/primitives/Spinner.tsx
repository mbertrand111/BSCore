import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  size?: SpinnerSize
  /** Accessible label. Set to undefined for purely decorative spinners (provide aria-hidden separately). */
  label?: string
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function Spinner({
  size = 'md',
  label = 'Loading',
  className,
  ...rest
}: SpinnerProps): React.JSX.Element {
  return (
    <svg
      role="status"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin text-current', SIZE_CLASSES[size], className)}
      {...rest}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
