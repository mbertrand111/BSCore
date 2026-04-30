'use client'

import type React from 'react'
import * as Radix from '@radix-ui/react-avatar'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Avatar with image + fallback (initials or placeholder).
 *
 *   <Avatar size="md">
 *     <AvatarImage src="/me.jpg" alt="Jane Doe" />
 *     <AvatarFallback>JD</AvatarFallback>
 *   </Avatar>
 *
 * The fallback renders only when the image fails or is loading.
 */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarShape = 'square' | 'circle'

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof Radix.Root> {
  size?: AvatarSize
  /** 'square' (default, rounded corners) or 'circle' (full pill). */
  shape?: AvatarShape
  className?: string
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const SHAPE_CLASSES: Record<AvatarShape, string> = {
  square: 'rounded-md',
  circle: 'rounded-full',
}

export function Avatar({
  size = 'md',
  shape = 'square',
  className,
  children,
  ...rest
}: AvatarProps): React.JSX.Element {
  return (
    <Radix.Root
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-muted text-muted-fg',
        SIZE_CLASSES[size],
        SHAPE_CLASSES[shape],
        className,
      )}
      {...rest}
    >
      {children}
    </Radix.Root>
  )
}

export interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof Radix.Image> {
  className?: string
}

export function AvatarImage({ className, ...rest }: AvatarImageProps): React.JSX.Element {
  return <Radix.Image className={cn('h-full w-full object-cover', className)} {...rest} />
}

export interface AvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof Radix.Fallback> {
  className?: string
}

export function AvatarFallback({
  className,
  children,
  ...rest
}: AvatarFallbackProps): React.JSX.Element {
  return (
    <Radix.Fallback
      className={cn('inline-flex h-full w-full items-center justify-center font-medium', className)}
      {...rest}
    >
      {children}
    </Radix.Fallback>
  )
}
