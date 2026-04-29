'use client'

import type React from 'react'
import * as Radix from '@radix-ui/react-tabs'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Tabs on Radix — orientation horizontal by default.
 *
 *   <Tabs defaultValue="overview">
 *     <TabsList>
 *       <TabsTrigger value="overview">Overview</TabsTrigger>
 *       <TabsTrigger value="settings">Settings</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="overview">…</TabsContent>
 *     <TabsContent value="settings">…</TabsContent>
 *   </Tabs>
 */

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof Radix.Root> {
  className?: string
}

export function Tabs({ className, children, ...rest }: TabsProps): React.JSX.Element {
  return (
    <Radix.Root className={cn('w-full', className)} {...rest}>
      {children}
    </Radix.Root>
  )
}

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof Radix.List> {
  className?: string
}

export function TabsList({ className, children, ...rest }: TabsListProps): React.JSX.Element {
  return (
    <Radix.List
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-muted p-1 text-muted-fg',
        className,
      )}
      {...rest}
    >
      {children}
    </Radix.List>
  )
}

export interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof Radix.Trigger> {
  className?: string
}

export function TabsTrigger({
  className,
  children,
  ...rest
}: TabsTriggerProps): React.JSX.Element {
  return (
    <Radix.Trigger
      className={cn(
        'inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-base',
        'hover:text-foreground',
        'data-[state=active]:bg-surface-elevated data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </Radix.Trigger>
  )
}

export interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof Radix.Content> {
  className?: string
}

export function TabsContent({
  className,
  children,
  ...rest
}: TabsContentProps): React.JSX.Element {
  return (
    <Radix.Content className={cn('mt-4 outline-none', className)} {...rest}>
      {children}
    </Radix.Content>
  )
}
