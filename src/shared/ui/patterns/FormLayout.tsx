import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Consistent form shape: vertical fields, error slots, footer with actions.
 * Composition-friendly: caller supplies fields and footer as children/slots.
 */
export interface FormLayoutProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
  footer?: React.ReactNode
  /** Optional global error region rendered above the fields. */
  globalError?: React.ReactNode
}

export function FormLayout({
  className,
  children,
  footer,
  globalError,
  ...rest
}: FormLayoutProps): React.JSX.Element {
  return (
    <form className={cn('space-y-5', className)} {...rest}>
      {globalError !== undefined ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
        >
          {globalError}
        </div>
      ) : null}

      <div className="space-y-5">{children}</div>

      {footer !== undefined ? (
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
          {footer}
        </div>
      ) : null}
    </form>
  )
}

export interface FormFieldProps {
  label: React.ReactNode
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

/**
 * A single labelled form field with error and hint slots.
 * Wrap inputs with this for consistent vertical alignment and accessibility.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
}: FormFieldProps): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error !== undefined ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint !== undefined ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-fg">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
