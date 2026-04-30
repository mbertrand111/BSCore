import type React from 'react'

/**
 * Visual preview of a Hero block — used both inside the editor (BlockCard
 * collapsed state) and on the public route. Identical look in both contexts
 * so what the user sees while editing matches what visitors see.
 *
 * `imageUrl` is resolved by the parent (admin: from MediaAsset map, public:
 * from getMediaPublicUrl). When absent, falls back to a soft pink-amber
 * gradient mirroring the photographer sandbox aesthetic.
 */
export interface HeroPreviewProps {
  title: string
  subtitle?: string | undefined
  imageUrl?: string | undefined
  /** When true, scale down for the editor preview (less tall). */
  compact?: boolean
}

export function HeroPreview({
  title,
  subtitle,
  imageUrl,
  compact = false,
}: HeroPreviewProps): React.JSX.Element {
  const minHeight = compact ? 'min-h-[180px]' : 'min-h-[360px]'
  const titleSize = compact ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl lg:text-6xl'
  return (
    <div
      className={`relative flex ${minHeight} w-full items-end overflow-hidden rounded-md`}
      style={
        imageUrl !== undefined
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%), url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {
              background:
                'linear-gradient(135deg, #2a1f24 0%, #4a2a3d 45%, #f9c5d1 100%)',
            }
      }
    >
      <div
        className="absolute inset-0 opacity-20"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 55%)',
        }}
      />
      <div className={`relative z-10 w-full ${compact ? 'p-6' : 'p-8 sm:p-12'}`}>
        <h2
          className={`${titleSize} font-heading italic leading-tight tracking-tight text-white`}
        >
          {title || 'Titre du Hero'}
        </h2>
        {subtitle !== undefined && subtitle !== '' ? (
          <p className={`mt-3 max-w-2xl ${compact ? 'text-sm' : 'text-base sm:text-lg'} text-white/85`}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}
