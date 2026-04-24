import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
    './src/client/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colors reference CSS variables set in globals.css.
      // Each project defines its own values — primitives stay brand-neutral.
      colors: {
        primary:        'hsl(var(--color-primary) / <alpha-value>)',
        'primary-fg':   'hsl(var(--color-primary-fg) / <alpha-value>)',
        secondary:      'hsl(var(--color-secondary) / <alpha-value>)',
        'secondary-fg': 'hsl(var(--color-secondary-fg) / <alpha-value>)',
        destructive:    'hsl(var(--color-destructive) / <alpha-value>)',
        'destructive-fg': 'hsl(var(--color-destructive-fg) / <alpha-value>)',
        muted:          'hsl(var(--color-muted) / <alpha-value>)',
        'muted-fg':     'hsl(var(--color-muted-fg) / <alpha-value>)',
        border:         'hsl(var(--color-border) / <alpha-value>)',
        background:     'hsl(var(--color-background) / <alpha-value>)',
        foreground:     'hsl(var(--color-foreground) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)',
        lg: 'calc(var(--radius) + 2px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
