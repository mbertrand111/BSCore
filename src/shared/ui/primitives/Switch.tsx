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
          'relative inline-block h-6 w-11 rounded-lg bg-muted transition-colors duration-base',
          'peer-checked:bg-primary',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
          'after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-lg after:bg-background after:shadow-sm after:transition-transform after:duration-base',
          'peer-checked:after:translate-x-5',
        )}
      />
      {label !== undefined ? <span className="text-sm text-foreground">{label}</span> : null}
    </label>
  )
}
