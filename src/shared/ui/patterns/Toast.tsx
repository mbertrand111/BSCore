'use client'

import type React from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as Radix from '@radix-ui/react-toast'
import { CheckCircle2, AlertCircle, Info as InfoIcon, X } from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Toast orchestration on Radix.
 *
 * Wrap the app once:
 *
 *   // src/app/layout.tsx
 *   <ToastProvider>{children}</ToastProvider>
 *
 * Then anywhere in a Client Component:
 *
 *   const { toast } = useToast()
 *   toast({ intent: 'success', title: 'Saved', description: 'Changes written.' })
 *
 * Defaults:
 *   - Auto-dismiss after 4s (configurable per toast via `duration`)
 *   - Stacked top-right on desktop, top on mobile
 *   - Reduced motion respected by Radix internally
 */

export type ToastIntent = 'success' | 'error' | 'info'

export interface ToastOptions {
  intent?: ToastIntent
  title: string
  description?: string
  /** Auto-dismiss duration in ms. Pass `Infinity` for sticky. Default 4000. */
  duration?: number
}

interface ToastItem extends Required<Omit<ToastOptions, 'description' | 'duration'>> {
  id: string
  description?: string
  duration: number
}

interface ToastApi {
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const DEFAULT_DURATION = 4000

export interface ToastProviderProps {
  children: React.ReactNode
  /** Limit how many toasts can be stacked at once. Older ones drop off. */
  limit?: number
}

export function ToastProvider({ children, limit = 5 }: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (options: ToastOptions): string => {
      const id = generateId()
      const item: ToastItem = {
        id,
        intent: options.intent ?? 'info',
        title: options.title,
        ...(options.description !== undefined ? { description: options.description } : {}),
        duration: options.duration ?? DEFAULT_DURATION,
      }
      setToasts((prev) => {
        const next = [...prev, item]
        return next.length > limit ? next.slice(next.length - limit) : next
      })
      return id
    },
    [limit],
  )

  const api = useMemo<ToastApi>(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={api}>
      <Radix.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastRoot key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
        <Radix.Viewport
          className={cn(
            'fixed top-4 right-4 z-toast flex w-full max-w-sm flex-col gap-2 outline-none',
            'sm:top-4 sm:right-4',
          )}
        />
      </Radix.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (ctx === null) {
    throw new Error('useToast() must be used inside <ToastProvider>')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Internal: a single toast row inside the viewport
// ---------------------------------------------------------------------------

const INTENT_CLASSES: Record<ToastIntent, string> = {
  success: 'border-success/40 bg-success/10',
  error:   'border-destructive/40 bg-destructive/10',
  info:    'border-info/40 bg-info/10',
}

const INTENT_ICONS: Record<ToastIntent, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />,
  error:   <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />,
  info:    <InfoIcon className="h-5 w-5 text-info" aria-hidden="true" />,
}

interface ToastRootProps {
  item: ToastItem
  onClose: () => void
}

function ToastRoot({ item, onClose }: ToastRootProps): React.JSX.Element {
  return (
    <Radix.Root
      duration={item.duration === Infinity ? 1_000_000_000 : item.duration}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      className={cn(
        'flex w-full items-start gap-3 rounded-md border bg-surface-elevated px-4 py-3 shadow-md',
        'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform data-[swipe=cancel]:duration-fast',
        'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
        INTENT_CLASSES[item.intent],
      )}
    >
      <div className="mt-0.5 shrink-0">{INTENT_ICONS[item.intent]}</div>
      <div className="min-w-0 flex-1">
        <Radix.Title className="text-sm font-medium text-foreground">{item.title}</Radix.Title>
        {item.description !== undefined ? (
          <Radix.Description className="mt-0.5 text-xs text-muted-fg">
            {item.description}
          </Radix.Description>
        ) : null}
      </div>
      <Radix.Close
        aria-label="Close"
        className="shrink-0 rounded-md p-1 text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Radix.Close>
    </Radix.Root>
  )
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// ---------------------------------------------------------------------------
// Visual-only Toast (kept for callers that already render their own state)
// ---------------------------------------------------------------------------

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  intent?: ToastIntent
  title: string
  description?: string
}

export function Toast({
  intent = 'info',
  title,
  description,
  className,
  ...rest
}: ToastProps): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex w-full max-w-md items-start gap-3 rounded-md border bg-surface-elevated px-4 py-3 shadow-md',
        INTENT_CLASSES[intent],
        className,
      )}
      {...rest}
    >
      <div className="mt-0.5 shrink-0">{INTENT_ICONS[intent]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description !== undefined ? (
          <p className="mt-0.5 text-xs text-muted-fg">{description}</p>
        ) : null}
      </div>
    </div>
  )
}
