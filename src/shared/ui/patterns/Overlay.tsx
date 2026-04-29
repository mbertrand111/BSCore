import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Generic overlay layer — used to dim content behind a modal, sheet, or
 * to anchor an absolute caption above an image (see ImageFrame).
 *
 * Modal already uses its own Radix-rendered overlay; this component is for
 * non-Radix surfaces (image hero, custom drawers, etc.).
 */
export type OverlayTone = 'dark' | 'light'
export type OverlayStrength = 'subtle' | 'medium' | 'strong'

export interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: OverlayTone
  strength?: OverlayStrength
  /** Render with absolute positioning filling its parent. */
  absolute?: boolean
}

const TONE_STRENGTH: Record<OverlayTone, Record<OverlayStrength, string>> = {
  dark: {
    subtle: 'bg-overlay-dark/30',
    medium: 'bg-overlay-dark/50',
    strong: 'bg-overlay-dark/70',
  },
  light: {
    subtle: 'bg-overlay-light/30',
    medium: 'bg-overlay-light/50',
    strong: 'bg-overlay-light/70',
  },
}

export function Overlay({
  tone = 'dark',
  strength = 'medium',
  absolute = true,
  className,
  children,
  ...rest
}: OverlayProps): React.JSX.Element {
  return (
    <div
      className={cn(
        absolute && 'absolute inset-0',
        TONE_STRENGTH[tone][strength],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
