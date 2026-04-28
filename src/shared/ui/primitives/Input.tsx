import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type InputState = 'default' | 'error'
export type InputSize = 'sm' | 'md'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  state?: InputState
  inputSize?: InputSize
}

const STATE_CLASSES: Record<InputState, string> = {
  default: 'border-border focus-visible:ring-primary',
  error:   'border-destructive focus-visible:ring-destructive',
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'h-8 px-2 text-xs',
  md: 'h-10 px-3 text-sm',
}

export function Input({
  state = 'default',
  inputSize = 'md',
  type = 'text',
  className,
  ...rest
}: InputProps): React.JSX.Element {
  return (
    <input
      type={type}
      className={cn(
        'block w-full rounded-md border bg-background text-foreground transition-colors',
        'placeholder:text-muted-fg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        STATE_CLASSES[state],
        SIZE_CLASSES[inputSize],
        className,
      )}
      {...rest}
    />
  )
}
