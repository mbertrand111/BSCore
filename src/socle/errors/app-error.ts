export type ErrorMeta = Record<string, unknown>

/**
 * Base error class for all application errors.
 * Subclass this to create domain-specific errors — never throw raw Error objects.
 *
 * Object.setPrototypeOf is required: TypeScript compiles classes extending
 * built-ins (Error, Map, etc.) in a way that breaks instanceof without it.
 */
export class AppError extends Error {
  readonly code: string
  readonly meta: ErrorMeta | undefined

  constructor(message: string, code: string, meta?: ErrorMeta) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.meta = meta
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
