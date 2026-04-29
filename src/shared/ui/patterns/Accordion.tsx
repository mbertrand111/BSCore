'use client'

import type React from 'react'
import * as Radix from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Accordion on Radix.
 *
 *   <Accordion type="single" collapsible defaultValue="a">
 *     <AccordionItem value="a">
 *       <AccordionTrigger>Question A</AccordionTrigger>
 *       <AccordionContent>Answer A.</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 *
 * Use `type="single"` for FAQ-style (one open at a time, optionally collapsible).
 * Use `type="multiple"` for settings panels where several can stay open.
 */

export type AccordionProps =
  | (React.ComponentPropsWithoutRef<typeof Radix.Root> & { type: 'single' })
  | (React.ComponentPropsWithoutRef<typeof Radix.Root> & { type: 'multiple' })

export function Accordion({ className, ...rest }: AccordionProps & { className?: string }): React.JSX.Element {
  return (
    <Radix.Root
      className={cn('divide-y divide-border rounded-md border border-border bg-surface', className)}
      {...rest}
    />
  )
}

export interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof Radix.Item> {
  className?: string
}

export function AccordionItem({
  className,
  children,
  ...rest
}: AccordionItemProps): React.JSX.Element {
  return (
    <Radix.Item className={cn('group', className)} {...rest}>
      {children}
    </Radix.Item>
  )
}

export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof Radix.Trigger> {
  className?: string
}

export function AccordionTrigger({
  className,
  children,
  ...rest
}: AccordionTriggerProps): React.JSX.Element {
  return (
    <Radix.Header className="flex">
      <Radix.Trigger
        className={cn(
          'flex flex-1 items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors duration-base',
          'hover:bg-muted/50',
          '[&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...rest}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-muted-fg transition-transform duration-base"
        />
      </Radix.Trigger>
    </Radix.Header>
  )
}

export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof Radix.Content> {
  className?: string
}

export function AccordionContent({
  className,
  children,
  ...rest
}: AccordionContentProps): React.JSX.Element {
  return (
    <Radix.Content
      className={cn(
        'overflow-hidden text-sm text-muted-fg',
        'data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up',
        className,
      )}
      {...rest}
    >
      <div className="px-4 pb-4 pt-1">{children}</div>
    </Radix.Content>
  )
}
