import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'soft' | 'accent'

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:  'bg-surface border border-border',
  outlined: 'bg-transparent border border-border',
  elevated: 'bg-surface-elevated border border-border shadow-md',
  soft:     'bg-surface-muted border border-transparent',
  accent:   'bg-accent/10 border border-accent/30 text-foreground',
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: React.ReactNode
}

export function Card({
  variant = 'default',
  className,
  children,
  ...rest
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn('overflow-hidden rounded-card', VARIANT_CLASSES[variant], className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

Card.Header = function CardHeader({
  className,
  children,
  ...rest
}: CardHeaderProps): React.JSX.Element {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 border-b border-border px-5 py-4', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

Card.Body = function CardBody({
  className,
  children,
  ...rest
}: CardBodyProps): React.JSX.Element {
  return (
    <div className={cn('px-5 py-4', className)} {...rest}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

Card.Footer = function CardFooter({
  className,
  children,
  ...rest
}: CardFooterProps): React.JSX.Element {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 border-t border-border px-5 py-3', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
