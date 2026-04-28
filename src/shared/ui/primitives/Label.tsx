import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  children: React.ReactNode
}

export function Label({
  required = false,
  className,
  children,
  ...rest
}: LabelProps): React.JSX.Element {
  return (
    <label
      className={cn('block text-sm font-medium text-foreground', className)}
      {...rest}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-destructive">
          *
        </span>
      ) : null}
    </label>
  )
}
