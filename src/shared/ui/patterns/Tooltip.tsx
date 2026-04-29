'use client'

import type React from 'react'
import * as Radix from '@radix-ui/react-tooltip'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Lightweight tooltip on Radix.
 *
 *   <TooltipProvider>
 *     <Tooltip>
 *       <TooltipTrigger asChild><Button>Hover me</Button></TooltipTrigger>
 *       <TooltipContent>Helpful hint</TooltipContent>
 *     </Tooltip>
 *   </TooltipProvider>
 *
 * Wrap the page (or just the parent of the tooltip) in a single
 * `<TooltipProvider>` once. Default delay 300ms.
 */

export interface TooltipProviderProps {
  delayDuration?: number
  skipDelayDuration?: number
  children: React.ReactNode
}

export function TooltipProvider({
  delayDuration = 300,
  skipDelayDuration = 200,
  children,
}: TooltipProviderProps): React.JSX.Element {
  return (
    <Radix.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      {children}
    </Radix.Provider>
  )
}

export interface TooltipProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Tooltip({ children, ...rest }: TooltipProps): React.JSX.Element {
  return <Radix.Root {...rest}>{children}</Radix.Root>
}

export const TooltipTrigger = Radix.Trigger

export interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof Radix.Content> {
  className?: string
}

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...rest
}: TooltipContentProps): React.JSX.Element {
  return (
    <Radix.Portal>
      <Radix.Content
        sideOffset={sideOffset}
        className={cn(
          'z-popover overflow-hidden rounded-sm border border-border bg-foreground px-2 py-1 text-xs text-background shadow-md',
          'data-[state=delayed-open]:animate-pop-in data-[state=closed]:animate-pop-out',
          className,
        )}
        {...rest}
      >
        {children}
        <Radix.Arrow className="fill-foreground" />
      </Radix.Content>
    </Radix.Portal>
  )
}
