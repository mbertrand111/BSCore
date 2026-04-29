import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'
import { Spinner } from './Spinner'

export type ButtonIntent = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'accent'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonRounded = 'md' | 'lg'

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  intent?: ButtonIntent
  size?: ButtonSize
  rounded?: ButtonRounded
  loading?: boolean
  /** Optional leading icon. Pair with aria-label on the button when icon-only. */
  leadingIcon?: React.ReactNode
  /** Optional trailing icon. */
  trailingIcon?: React.ReactNode
  children: React.ReactNode
}

const INTENT_CLASSES: Record<ButtonIntent, string> = {
  primary:     'bg-primary text-primary-fg shadow-sm hover:bg-primary/90 active:bg-primary/95',
  secondary:   'bg-secondary text-secondary-fg hover:bg-secondary/80 active:bg-secondary/90',
  destructive: 'bg-destructive text-destructive-fg shadow-sm hover:bg-destructive/90 active:bg-destructive/95',
  accent:      'bg-accent text-accent-fg shadow-sm hover:bg-accent/90 active:bg-accent/95',
  ghost:       'bg-transparent text-foreground hover:bg-muted active:bg-muted/80',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

const ROUNDED_CLASSES: Record<ButtonRounded, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
}

export function Button({
  intent = 'primary',
  size = 'md',
  rounded = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      disabled={disabled === true || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium',
        'transition-[background-color,color,opacity,transform] duration-base',
        'active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50',
        INTENT_CLASSES[intent],
        SIZE_CLASSES[size],
        ROUNDED_CLASSES[rounded],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" aria-hidden="true" />
      ) : leadingIcon !== undefined ? (
        <span aria-hidden="true" className="inline-flex shrink-0">{leadingIcon}</span>
      ) : null}
      <span>{children}</span>
      {!loading && trailingIcon !== undefined ? (
        <span aria-hidden="true" className="inline-flex shrink-0">{trailingIcon}</span>
      ) : null}
    </button>
  )
}
