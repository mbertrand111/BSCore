import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ className, children, ...rest }: CardProps): React.JSX.Element {
  return (
    <div
      className={cn('rounded-md border border-border bg-background', className)}
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
      className={cn('flex items-center justify-between border-b border-border px-4 py-3', className)}
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
    <div className={cn('p-4', className)} {...rest}>
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
      className={cn('flex items-center justify-end gap-2 border-t border-border px-4 py-3', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
