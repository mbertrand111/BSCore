import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Centered max-width container with horizontal padding.
 * Use for page-level wrappers; admin sections nest inside.
 */
export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize
  children: React.ReactNode
}

const SIZE_CLASSES: Record<ContainerSize, string> = {
  sm:   'max-w-screen-sm',
  md:   'max-w-screen-md',
  lg:   'max-w-screen-lg',
  xl:   'max-w-screen-xl',
  full: 'max-w-full',
}

export function Container({
  size = 'lg',
  className,
  children,
  ...rest
}: ContainerProps): React.JSX.Element {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', SIZE_CLASSES[size], className)}
      {...rest}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export type GridCols = 1 | 2 | 3 | 4
export type GridGap = 'sm' | 'md' | 'lg'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Responsive column count.
   *   - mobile: always 1
   *   - sm:     `cols` capped at 2 unless explicitly 1
   *   - md:     `cols` (the requested number)
   *   - lg:     `cols`
   * Pass a single number for the desktop target — the responsive ladder is fixed.
   */
  cols?: GridCols
  gap?: GridGap
  children: React.ReactNode
}

const COLS_CLASSES: Record<GridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

const GAP_CLASSES: Record<GridGap, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
}

export function Grid({
  cols = 3,
  gap = 'md',
  className,
  children,
  ...rest
}: GridProps): React.JSX.Element {
  return (
    <div
      className={cn('grid', COLS_CLASSES[cols], GAP_CLASSES[gap], className)}
      {...rest}
    >
      {children}
    </div>
  )
}
