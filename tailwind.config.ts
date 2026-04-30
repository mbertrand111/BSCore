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
        'subtle-fg':      'hsl(var(--color-subtle-fg) / <alpha-value>)',
        border:           'hsl(var(--color-border) / <alpha-value>)',

        surface:            'hsl(var(--color-surface) / <alpha-value>)',
        'surface-muted':    'hsl(var(--color-surface-muted) / <alpha-value>)',
        'surface-sunken':   'hsl(var(--color-surface-sunken) / <alpha-value>)',
        'surface-elevated': 'hsl(var(--color-surface-elevated) / <alpha-value>)',

        primary:          'hsl(var(--color-primary) / <alpha-value>)',
        'primary-fg':     'hsl(var(--color-primary-fg) / <alpha-value>)',
        secondary:        'hsl(var(--color-secondary) / <alpha-value>)',
        'secondary-fg':   'hsl(var(--color-secondary-fg) / <alpha-value>)',
        accent:           'hsl(var(--color-accent) / <alpha-value>)',
        'accent-fg':      'hsl(var(--color-accent-fg) / <alpha-value>)',
        'accent-text':    'hsl(var(--color-accent-text) / <alpha-value>)',

        destructive:      'hsl(var(--color-destructive) / <alpha-value>)',
        'destructive-fg': 'hsl(var(--color-destructive-fg) / <alpha-value>)',
        success:          'hsl(var(--color-success) / <alpha-value>)',
        'success-fg':     'hsl(var(--color-success-fg) / <alpha-value>)',
        warning:          'hsl(var(--color-warning) / <alpha-value>)',
        'warning-fg':     'hsl(var(--color-warning-fg) / <alpha-value>)',
        info:             'hsl(var(--color-info) / <alpha-value>)',
        'info-fg':        'hsl(var(--color-info-fg) / <alpha-value>)',

        'overlay-dark':   'hsl(var(--color-overlay-dark) / <alpha-value>)',
        'overlay-light':  'hsl(var(--color-overlay-light) / <alpha-value>)',

        'sidebar-bg':         'hsl(var(--color-sidebar-bg) / <alpha-value>)',
        'sidebar-fg':         'hsl(var(--color-sidebar-fg) / <alpha-value>)',
        'sidebar-muted-fg':   'hsl(var(--color-sidebar-muted-fg) / <alpha-value>)',
        'sidebar-border':     'hsl(var(--color-sidebar-border) / <alpha-value>)',
        'sidebar-active-bg':  'hsl(var(--color-sidebar-active-bg) / <alpha-value>)',
        'sidebar-active-fg':  'hsl(var(--color-sidebar-active-fg) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        card: 'var(--radius-card)',
        DEFAULT: 'var(--radius-md)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        DEFAULT: 'var(--shadow-md)',
      },
      fontFamily: {
        sans:       ['var(--font-sans)'],
        mono:       ['var(--font-mono)'],
        body:       ['var(--font-body)'],
        heading:    ['var(--font-heading)'],
        subheading: ['var(--font-subheading)'],
      },
      ringColor: {
        DEFAULT: 'hsl(var(--ring-color))',
      },
      ringOffsetColor: {
        DEFAULT: 'hsl(var(--ring-offset-color))',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        base: 'var(--motion-base)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        standard:   'var(--ease-standard)',
        emphasized: 'var(--ease-emphasized)',
      },
      zIndex: {
        sticky:   'var(--z-sticky)',
        dropdown: 'var(--z-dropdown)',
        modal:    'var(--z-modal)',
        popover:  'var(--z-popover)',
        toast:    'var(--z-toast)',
      },
      keyframes: {
        'overlay-in':    { from: { opacity: '0' }, to: { opacity: '1' } },
        'overlay-out':   { from: { opacity: '1' }, to: { opacity: '0' } },
        'content-in':    {
          from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
          to:   { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        'content-out':   {
          from: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          to:   { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
        },
        'pop-in':  { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'pop-out': { from: { opacity: '1', transform: 'scale(1)' }, to: { opacity: '0', transform: 'scale(0.96)' } },
        'slide-in-left':  { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'slide-out-left': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-100%)' } },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'overlay-in':     'overlay-in  var(--motion-fast) var(--ease-standard)',
        'overlay-out':    'overlay-out var(--motion-fast) var(--ease-standard)',
        'content-in':     'content-in  var(--motion-base) var(--ease-emphasized)',
        'content-out':    'content-out var(--motion-fast) var(--ease-standard)',
        'pop-in':         'pop-in  var(--motion-fast) var(--ease-standard)',
        'pop-out':        'pop-out var(--motion-fast) var(--ease-standard)',
        'slide-in-left':  'slide-in-left  var(--motion-base) var(--ease-emphasized)',
        'slide-out-left': 'slide-out-left var(--motion-fast) var(--ease-standard)',
        'accordion-down': 'accordion-down var(--motion-base) var(--ease-standard)',
        'accordion-up':   'accordion-up   var(--motion-base) var(--ease-standard)',
      },
    },
  },
  plugins: [],
}

export default config
