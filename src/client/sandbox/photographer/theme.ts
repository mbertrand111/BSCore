/**
 * Photographer sandbox — theme tokens.
 *
 * This is a CLIENT-LEVEL sandbox: an isolated visual prototype for a wedding
 * photographer (Aurélie Lambert). It exists to exercise the public-facing
 * surfaces (CMS / Media / SEO) on a real-feeling layout. It is NOT the
 * default BSCore theme; nothing here should leak into the admin shell or
 * other routes.
 *
 * Tokens are documented here as TypeScript constants (mirror of
 * `theme.css`). When a real client clones BSCore, they replace this file
 * with their own brand. Until then, the sandbox demonstrates the contract.
 *
 * Palette: ivory / sand / stone / charcoal — editorial, low saturation,
 * built for photo-heavy layouts.
 *
 * Typography: Playfair Display (serif) + Inter (sans). Loaded via
 * `next/font/google` from the sandbox layout so they only ship on sandbox
 * routes.
 */

export const photographerTheme = {
  color: {
    bg: '#ffffff',
    cream: '#f0ece5',
    sand: '#d9d2c5',
    stone: '#8a8478',
    charcoal: '#1f1d1a',
    ink: '#222020',
    muted: '#6b6760',
    line: '#e6e0d6',
  },
  motion: {
    fast: '120ms',
    base: '220ms',
    slow: '420ms',
    easeStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeEmphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  scale: {
    radiusSm: '2px',
    radiusMd: '4px',
    radiusLg: '8px',
  },
} as const

export type PhotographerTheme = typeof photographerTheme
