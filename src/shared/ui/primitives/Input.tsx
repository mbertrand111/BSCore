import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type InputState = 'default' | 'error'
export type InputSize = 'sm' | 'md'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  state?: InputState
  inputSize?: InputSize
  /** Optional leading element rendered inside the input frame (e.g. an icon). */
  leadingSlot?: React.ReactNode
  /** Optional trailing element rendered inside the input frame. */
  trailingSlot?: React.ReactNode
}

const STATE_CLASSES: Record<InputState, string> = {
  default: 'border-border focus-within:border-primary focus-within:ring-primary',
  error:   'border-destructive focus-within:border-destructive focus-within:ring-destructive',
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'h-9 text-xs',
  md: 'h-11 text-sm',
}

export function Input({
  state = 'default',
  inputSize = 'md',
  type = 'text',
  className,
  leadingSlot,
  trailingSlot,
  ...rest
}: InputProps): React.JSX.Element {
  if (leadingSlot === undefined && trailingSlot === undefined) {
    return (
      <input
        type={type}
        className={cn(
          'block w-full rounded-md border bg-surface px-3 text-foreground transition-colors duration-base',
          'placeholder:text-muted-fg',
          'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
          STATE_CLASSES[state],
          SIZE_CLASSES[inputSize],
          className,
        )}
        {...rest}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 rounded-md border bg-surface px-3 text-foreground transition-colors duration-base focus-within:ring-2 focus-within:ring-offset-1',
        STATE_CLASSES[state],
        SIZE_CLASSES[inputSize],
        className,
      )}
    >
      {leadingSlot !== undefined ? (
        <span className="inline-flex shrink-0 text-muted-fg">{leadingSlot}</span>
      ) : null}
      <input
        type={type}
        className={cn(
          'block w-full bg-transparent py-2 outline-none',
          'placeholder:text-muted-fg',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
        {...rest}
      />
      {trailingSlot !== undefined ? (
        <span className="inline-flex shrink-0 text-muted-fg">{trailingSlot}</span>
      ) : null}
    </div>
  )
}
