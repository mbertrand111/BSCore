import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type CheckboxState = 'default' | 'error'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  state?: CheckboxState
}

const STATE_CLASSES: Record<CheckboxState, string> = {
  default: 'border-border',
  error:   'border-destructive',
}

export function Checkbox({
  state = 'default',
  className,
  ...rest
}: CheckboxProps): React.JSX.Element {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded-sm border bg-background text-primary transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        STATE_CLASSES[state],
        className,
      )}
      {...rest}
    />
  )
}
