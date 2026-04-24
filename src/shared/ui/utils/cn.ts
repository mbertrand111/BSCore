import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind class names safely, resolving conflicts in favour of
 * the last value (e.g. `cn('px-2', 'px-4')` → `'px-4'`).
 * Accepts any value clsx accepts: strings, arrays, objects, falsy values.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
