import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type TextareaState = 'default' | 'error'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: TextareaState
}

const STATE_CLASSES: Record<TextareaState, string> = {
  default: 'border-border focus:border-primary focus-visible:ring-primary',
  error:   'border-destructive focus:border-destructive focus-visible:ring-destructive',
}

export function Textarea({
  state = 'default',
  rows = 4,
  className,
  ...rest
}: TextareaProps): React.JSX.Element {
  return (
    <textarea
      rows={rows}
      className={cn(
        'block w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground transition-colors duration-base',
        'placeholder:text-muted-fg',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
        STATE_CLASSES[state],
        className,
      )}
      {...rest}
    />
  )
}
