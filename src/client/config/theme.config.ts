/**
 * Theme manifest — declares every token the design system reads.
 *
 * This file is the per-client brand override point. Out of the box it lists
 * the neutral defaults so the project boots with a coherent UI. To re-brand
 * for a client:
 *   1. Update the values below
 *   2. Mirror them in src/app/globals.css (the runtime source of truth that
 *      Tailwind reads via CSS variables)
 *
 * Why two locations? Tailwind's JIT compiler reads token values at build
 * time from CSS variables in globals.css. This file is the authoritative
 * TypeScript manifest — it documents the contract and can be imported by
 * tests, theme-validation tools, or future per-environment loaders.
 *
 * Format: HSL "H S% L%" (no `hsl()` wrapper) so Tailwind's
 * `<alpha-value>` placeholder works.
 *
 * See docs/FRONTEND.md §5 for the rules: no hex/rgb/hsl in components, no
 * tokens hardcoded outside this file + globals.css.
 */

export interface ThemeTokens {
  readonly color: {
    readonly background: string
    readonly foreground: string
    readonly muted: string
    readonly mutedFg: string
    readonly border: string
    readonly primary: string
    readonly primaryFg: string
    readonly secondary: string
    readonly secondaryFg: string
    readonly accent: string
    readonly accentFg: string
    readonly destructive: string
    readonly destructiveFg: string
    readonly success: string
    readonly successFg: string
    readonly warning: string
    readonly warningFg: string
    readonly info: string
    readonly infoFg: string
  }
  readonly radius: {
    readonly sm: string
    readonly md: string
    readonly lg: string
  }
  readonly font: {
    readonly sans: string
    readonly mono: string
  }
}

export const themeTokens: ThemeTokens = {
  color: {
    background:    '0 0% 100%',
    foreground:    '210 30% 8%',
    muted:         '210 15% 96%',
    mutedFg:       '210 10% 45%',
    border:        '210 15% 88%',
    primary:       '210 100% 45%',
    primaryFg:     '0 0% 100%',
    secondary:     '210 15% 94%',
    secondaryFg:   '210 30% 20%',
    accent:        '262 83% 58%',
    accentFg:      '0 0% 100%',
    destructive:   '0 84% 60%',
    destructiveFg: '0 0% 100%',
    success:       '142 71% 38%',
    successFg:     '0 0% 100%',
    warning:       '38 92% 50%',
    warningFg:     '210 30% 8%',
    info:          '200 95% 45%',
    infoFg:        '0 0% 100%',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  },
  font: {
    sans: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace",
  },
}
