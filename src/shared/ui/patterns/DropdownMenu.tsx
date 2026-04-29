'use client'

import type React from 'react'
import * as Radix from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Keyboard-navigable dropdown menu built on Radix.
 *
 * Sub-components are exported individually for RSC compatibility.
 *
 *   import {
 *     DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
 *     DropdownMenuItem, DropdownMenuSeparator,
 *   } from '@/shared/ui/patterns'
 *
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild><Button>Actions</Button></DropdownMenuTrigger>
 *     <DropdownMenuContent>
 *       <DropdownMenuItem onSelect={...}>Edit</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem destructive onSelect={...}>Delete</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */

interface DropdownMenuProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  children: React.ReactNode
}

export function DropdownMenu({ children, ...rest }: DropdownMenuProps): React.JSX.Element {
  return <Radix.Root {...rest}>{children}</Radix.Root>
}

export const DropdownMenuTrigger = Radix.Trigger

interface DropdownMenuContentProps extends React.ComponentPropsWithoutRef<typeof Radix.Content> {
  className?: string
}

export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 6,
  children,
  ...rest
}: DropdownMenuContentProps): React.JSX.Element {
  return (
    <Radix.Portal>
      <Radix.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-popover min-w-[10rem] overflow-hidden rounded-md border border-border bg-surface-elevated p-1 text-sm text-foreground shadow-lg',
          'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
          className,
        )}
        {...rest}
      >
        {children}
      </Radix.Content>
    </Radix.Portal>
  )
}

interface DropdownMenuItemProps extends React.ComponentPropsWithoutRef<typeof Radix.Item> {
  destructive?: boolean
}

export function DropdownMenuItem({
  className,
  destructive = false,
  children,
  ...rest
}: DropdownMenuItemProps): React.JSX.Element {
  return (
    <Radix.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 outline-none',
        destructive
          ? 'text-destructive data-[highlighted]:bg-destructive/10'
          : 'data-[highlighted]:bg-muted',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </Radix.Item>
  )
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <Radix.Label className={cn('px-2 py-1.5 text-xs font-medium text-muted-fg', className)}>
      {children}
    </Radix.Label>
  )
}

export function DropdownMenuSeparator(): React.JSX.Element {
  return <Radix.Separator className="my-1 h-px bg-border" />
}

interface DropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof Radix.CheckboxItem> {
  className?: string
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...rest
}: DropdownMenuCheckboxItemProps): React.JSX.Element {
  return (
    <Radix.CheckboxItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-7 pr-2 outline-none',
        'data-[highlighted]:bg-muted',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    >
      <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
        <Radix.ItemIndicator>
          <Check className="h-4 w-4 text-primary" />
        </Radix.ItemIndicator>
      </span>
      {children}
    </Radix.CheckboxItem>
  )
}
