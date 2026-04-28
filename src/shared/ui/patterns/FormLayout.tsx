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
    <form className={cn('space-y-4', className)} {...rest}>
      {globalError !== undefined ? (
        <div role="alert" className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-foreground">
          {globalError}
        </div>
      ) : null}

      <div className="space-y-4">{children}</div>

      {footer !== undefined ? (
        <div className="flex items-center justify-end gap-2 pt-2">{footer}</div>
      ) : null}
    </form>
  )
}

export interface FormFieldProps {
  /** Field label text — pair with id on the input. */
  label: React.ReactNode
  /** htmlFor target — must match the input's id. */
  htmlFor: string
  /** Inline field error. Triggers the error-state styling. */
  error?: string
  /** Optional helper text shown below the field when no error is present. */
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
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
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
