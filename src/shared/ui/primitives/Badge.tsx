import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type BadgeIntent = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  intent?: BadgeIntent
  children: React.ReactNode
}

const INTENT_CLASSES: Record<BadgeIntent, string> = {
  neutral: 'bg-muted text-muted-fg',
  success: 'bg-success text-success-fg',
  warning: 'bg-warning text-warning-fg',
  danger:  'bg-destructive text-destructive-fg',
  info:    'bg-info text-info-fg',
}

export function Badge({
  intent = 'neutral',
  className,
  children,
  ...rest
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium',
        INTENT_CLASSES[intent],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
