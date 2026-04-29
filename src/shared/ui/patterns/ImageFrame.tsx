import type React from 'react'
import { cn } from '@/shared/ui/utils/cn'

/**
 * Responsive image frame with consistent border-radius and an optional
 * overlay slot for captions or actions on top of the image.
 *
 * The image element is the caller's responsibility — pass a `<img>` or a
 * `<Image>` from next/image as `children`. This pattern only handles the
 * frame, aspect, and overlay positioning.
 */
export type ImageFrameRadius = 'sm' | 'md' | 'lg' | 'card'

export interface ImageFrameProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Aspect ratio class — e.g. 'aspect-video', 'aspect-square'. Defaults to aspect-video. */
  aspectClassName?: string
  radius?: ImageFrameRadius
  /** Image element (img / next/image / picture). */
  children: React.ReactNode
  /** Optional content rendered absolutely on top — e.g. a caption with an Overlay. */
  overlay?: React.ReactNode
}

const RADIUS_CLASSES: Record<ImageFrameRadius, string> = {
  sm:   'rounded-sm',
  md:   'rounded-md',
  lg:   'rounded-lg',
  card: 'rounded-card',
}

export function ImageFrame({
  aspectClassName = 'aspect-video',
  radius = 'card',
  children,
  overlay,
  className,
  ...rest
}: ImageFrameProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted [&_img]:h-full [&_img]:w-full [&_img]:object-cover',
        aspectClassName,
        RADIUS_CLASSES[radius],
        className,
      )}
      {...rest}
    >
      {children}
      {overlay !== undefined ? <div className="absolute inset-0">{overlay}</div> : null}
    </div>
  )
}
