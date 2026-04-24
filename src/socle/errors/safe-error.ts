import { getEnv } from '@/socle/config/env'
import type { AppError, ErrorMeta } from './app-error'

/**
 * Safe, external-facing error shape.
 * Never contains a stack trace. Meta is only present in development.
 */
export interface SafeError {
  readonly code: string
  readonly message: string
  readonly meta?: ErrorMeta
}

/**
 * Serialize an AppError for external callers (API responses, client output).
 * Stack traces are always stripped. Meta is included only in development,
 * where the developer is trusted and diagnostics are valuable.
 */
export function toSafeError(error: AppError): SafeError {
  const isDevelopment = getEnv('NODE_ENV') === 'development'

  if (isDevelopment && error.meta !== undefined) {
    return { code: error.code, message: error.message, meta: error.meta }
  }

  return { code: error.code, message: error.message }
}
