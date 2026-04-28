import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type SelectState = 'default' | 'error'
export type SelectSize = 'sm' | 'md'

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  state?: SelectState
  selectSize?: SelectSize
  children: React.ReactNode
}

const STATE_CLASSES: Record<SelectState, string> = {
  default: 'border-border focus-visible:ring-primary',
  error:   'border-destructive focus-visible:ring-destructive',
}

const SIZE_CLASSES: Record<SelectSize, string> = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-10 px-3 text-sm',
}

export function Select({
  state = 'default',
  selectSize = 'md',
  className,
  children,
  ...rest
}: SelectProps): React.JSX.Element {
  return (
    <select
      className={cn(
        'block w-full rounded-md border bg-background text-foreground transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        STATE_CLASSES[state],
        SIZE_CLASSES[selectSize],
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  )
}
