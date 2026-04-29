'use client'

import type React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'

export type SelectState = 'default' | 'error'
export type SelectSize = 'sm' | 'md'

/**
 * Custom dropdown select built on Radix — keyboard-navigable, animated,
 * portal-rendered.
 *
 * Sub-components are exported individually so they work across
 * Server Component → Client Component boundaries (the `Component.Sub`
 * dot-notation pattern fails to serialize in Next.js RSC).
 *
 *   import { Select, SelectItem, SelectLabel, SelectSeparator } from '@/shared/ui/primitives'
 *   <Select value={...} onValueChange={...} placeholder="Pick a role">
 *     <SelectLabel>Roles</SelectLabel>
 *     <SelectItem value="admin">Admin</SelectItem>
 *     <SelectItem value="super_admin">Super admin</SelectItem>
 *   </Select>
 */

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  name?: string
  state?: SelectState
  size?: SelectSize
  id?: string
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'data-testid'?: string
  children: React.ReactNode
}

const STATE_CLASSES: Record<SelectState, string> = {
  default: 'border-border data-[state=open]:border-primary',
  error:   'border-destructive',
}

const SIZE_CLASSES: Record<SelectSize, string> = {
  sm: 'h-9 text-xs',
  md: 'h-11 text-sm',
}

export function Select({
  state = 'default',
  size = 'md',
  className,
  placeholder,
  children,
  id,
  name,
  required,
  disabled,
  value,
  defaultValue,
  onValueChange,
  ...aria
}: SelectProps): React.JSX.Element {
  return (
    <RadixSelect.Root
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onValueChange ? { onValueChange } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(required !== undefined ? { required } : {})}
      {...(name !== undefined ? { name } : {})}
    >
      <RadixSelect.Trigger
        id={id}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-foreground transition-colors duration-base',
          'data-[placeholder]:text-muted-fg',
          'data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:opacity-60',
          STATE_CLASSES[state],
          SIZE_CLASSES[size],
          className,
        )}
        {...aria}
      >
        <RadixSelect.Value {...(placeholder !== undefined ? { placeholder } : {})} />
        <RadixSelect.Icon className="text-muted-fg">
          <ChevronDown className="h-4 w-4" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-popover max-h-[--radix-select-content-available-height] min-w-[--radix-select-trigger-width] overflow-hidden rounded-md border border-border bg-surface-elevated text-foreground shadow-lg',
            'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
          )}
        >
          <RadixSelect.ScrollUpButton className="flex h-7 cursor-default items-center justify-center bg-surface-elevated text-muted-fg">
            <ChevronUp className="h-4 w-4" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-7 cursor-default items-center justify-center bg-surface-elevated text-muted-fg">
            <ChevronDown className="h-4 w-4" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

export interface SelectItemProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function SelectItem({
  value,
  disabled,
  className,
  children,
}: SelectItemProps): React.JSX.Element {
  return (
    <RadixSelect.Item
      value={value}
      {...(disabled !== undefined ? { disabled } : {})}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-7 py-2 text-sm outline-none',
        'data-[highlighted]:bg-muted data-[highlighted]:text-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
    >
      <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <Check className="h-4 w-4 text-primary" />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  )
}

export interface SelectLabelProps {
  className?: string
  children: React.ReactNode
}

export function SelectLabel({ className, children }: SelectLabelProps): React.JSX.Element {
  return (
    <RadixSelect.Label
      className={cn('px-2 py-1.5 text-xs font-medium text-muted-fg', className)}
    >
      {children}
    </RadixSelect.Label>
  )
}

export function SelectSeparator(): React.JSX.Element {
  return <RadixSelect.Separator className="my-1 h-px bg-border" />
}

export interface SelectGroupProps {
  className?: string
  children: React.ReactNode
}

/**
 * Groups a `SelectLabel` together with one or more `SelectItem`s.
 * Required by Radix when using `SelectLabel` — labels cannot be standalone.
 */
export function SelectGroup({ className, children }: SelectGroupProps): React.JSX.Element {
  return <RadixSelect.Group className={className}>{children}</RadixSelect.Group>
}
