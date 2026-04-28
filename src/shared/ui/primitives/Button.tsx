import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'
import { Spinner } from './Spinner'

export type ButtonIntent = 'primary' | 'secondary' | 'destructive' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  intent?: ButtonIntent
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const INTENT_CLASSES: Record<ButtonIntent, string> = {
  primary:     'bg-primary text-primary-fg hover:bg-primary/90',
  secondary:   'bg-secondary text-secondary-fg hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-fg hover:bg-destructive/90',
  ghost:       'bg-transparent text-foreground hover:bg-muted',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  intent = 'primary',
  size = 'md',
  loading = false,
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
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        INTENT_CLASSES[intent],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size="sm" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
