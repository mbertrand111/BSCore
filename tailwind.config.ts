import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './src/socle-plus/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/client/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colors reference CSS variables set in globals.css.
      // Each project defines its own values — primitives stay brand-neutral.
      colors: {
        background:       'hsl(var(--color-background) / <alpha-value>)',
        foreground:       'hsl(var(--color-foreground) / <alpha-value>)',
        muted:            'hsl(var(--color-muted) / <alpha-value>)',
        'muted-fg':       'hsl(var(--color-muted-fg) / <alpha-value>)',
        border:           'hsl(var(--color-border) / <alpha-value>)',

        primary:          'hsl(var(--color-primary) / <alpha-value>)',
        'primary-fg':     'hsl(var(--color-primary-fg) / <alpha-value>)',
        secondary:        'hsl(var(--color-secondary) / <alpha-value>)',
        'secondary-fg':   'hsl(var(--color-secondary-fg) / <alpha-value>)',
        accent:           'hsl(var(--color-accent) / <alpha-value>)',
        'accent-fg':      'hsl(var(--color-accent-fg) / <alpha-value>)',

        destructive:      'hsl(var(--color-destructive) / <alpha-value>)',
        'destructive-fg': 'hsl(var(--color-destructive-fg) / <alpha-value>)',
        success:          'hsl(var(--color-success) / <alpha-value>)',
        'success-fg':     'hsl(var(--color-success-fg) / <alpha-value>)',
        warning:          'hsl(var(--color-warning) / <alpha-value>)',
        'warning-fg':     'hsl(var(--color-warning-fg) / <alpha-value>)',
        info:             'hsl(var(--color-info) / <alpha-value>)',
        'info-fg':        'hsl(var(--color-info-fg) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        DEFAULT: 'var(--radius-md)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
}

export default config
