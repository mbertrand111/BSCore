'use client'

import type React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Accessible modal dialog built on Radix.
 *
 * Sub-components are exported individually so they work across
 * Server Component → Client Component boundaries (the `Component.Sub`
 * dot-notation pattern fails to serialize in Next.js RSC).
 *
 *   import {
 *     Modal, ModalTrigger, ModalContent, ModalHeader,
 *     ModalTitle, ModalBody, ModalFooter, ModalClose,
 *   } from '@/shared/ui/patterns'
 *
 *   <Modal open={open} onOpenChange={setOpen}>
 *     <ModalTrigger asChild><Button>Open</Button></ModalTrigger>
 *     <ModalContent size="md">
 *       <ModalHeader><ModalTitle>Confirm</ModalTitle></ModalHeader>
 *       <ModalBody>...</ModalBody>
 *       <ModalFooter>
 *         <ModalClose asChild><Button intent="ghost">Cancel</Button></ModalClose>
 *         <Button intent="destructive">Delete</Button>
 *       </ModalFooter>
 *     </ModalContent>
 *   </Modal>
 *
 * Provides: overlay fade animation, content fade-scale animation, focus trap,
 * ESC + click-outside close, portal rendering.
 */

export interface ModalProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  children: React.ReactNode
}

export function Modal({ children, ...rest }: ModalProps): React.JSX.Element {
  return <Dialog.Root {...rest}>{children}</Dialog.Root>
}

// Direct re-exports for the Radix primitives that don't need styling.
export const ModalTrigger = Dialog.Trigger
export const ModalClose = Dialog.Close

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
} as const

export type ModalSize = keyof typeof SIZE_CLASSES

export interface ModalContentProps {
  size?: ModalSize
  hideCloseButton?: boolean
  className?: string
  children: React.ReactNode
}

export function ModalContent({
  size = 'md',
  hideCloseButton = false,
  className,
  children,
}: ModalContentProps): React.JSX.Element {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          'fixed inset-0 z-modal bg-overlay-dark/50',
          'data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out',
        )}
      />
      <Dialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-modal w-[95vw] -translate-x-1/2 -translate-y-1/2',
          'rounded-card border border-border bg-surface-elevated shadow-lg',
          'data-[state=open]:animate-content-in data-[state=closed]:animate-content-out',
          SIZE_CLASSES[size],
          className,
        )}
      >
        {children}
        {!hideCloseButton ? (
          <Dialog.Close
            className={cn(
              'absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-fg transition-colors',
              'hover:bg-muted hover:text-foreground',
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        ) : null}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

export function ModalHeader({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={cn('space-y-1 border-b border-border px-5 py-4', className)}>
      {children}
    </div>
  )
}

export function ModalTitle({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Dialog.Title className={cn('text-base font-semibold text-foreground', className)}>
      {children}
    </Dialog.Title>
  )
}

export function ModalDescription({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Dialog.Description className={cn('text-sm text-muted-fg', className)}>
      {children}
    </Dialog.Description>
  )
}

export function ModalBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return <div className={cn('px-5 py-4 text-sm text-foreground', className)}>{children}</div>
}

export function ModalFooter({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 border-t border-border px-5 py-3 sm:flex-row sm:justify-end',
        className,
      )}
    >
      {children}
    </div>
  )
}
