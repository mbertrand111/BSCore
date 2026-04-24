import { AppError } from './app-error'
import { InternalError } from './error-types'

/**
 * Normalize any thrown value into an AppError.
 * Use this at error boundaries (catch blocks, API handlers) to convert
 * unknown errors into a typed, loggable form.
 *
 * The original message is always preserved internally. Stack traces and
 * sensitive details must not be forwarded to callers — use toSafeError for that.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new InternalError(error.message, { originalName: error.name })
  }

  if (typeof error === 'string') {
    return new InternalError(error)
  }

  return new InternalError()
}
