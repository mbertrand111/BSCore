import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Visual on/off toggle. Renders a native checkbox under the hood so it works
 * inside forms (including Server Actions) without any client-side state.
 * The caller controls `checked` and provides `onChange`.
 *
 * Use `<Checkbox>` for form-style boolean fields and `<Switch>` for
 * instant-effect settings (e.g. "enable notifications").
 */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
}

export function Switch({
  className,
  label,
  ...rest
}: SwitchProps): React.JSX.Element {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2', className)}>
      <input type="checkbox" className="peer sr-only" {...rest} />
      <span
        aria-hidden="true"
        className={cn(
          'relative h-5 w-9 rounded-md bg-muted transition-colors',
          'peer-checked:bg-primary',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
          'after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-md after:bg-background after:transition-transform',
          'peer-checked:after:translate-x-4',
        )}
      />
      {label !== undefined ? <span className="text-sm text-foreground">{label}</span> : null}
    </label>
  )
}
