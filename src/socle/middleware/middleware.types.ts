/**
 * Core middleware types — no framework imports, no Socle layer imports.
 * These are the contracts every layer above Socle depends on.
 */

export interface RequestContext {
  readonly requestId: string
  readonly timestamp: Date
  readonly path: string
  readonly method: string
  /**
   * Shared mutable bag for passing data between middleware in the same request.
   * readonly prevents replacing the reference; the contents remain mutable.
   * Readers must narrow values from unknown — no assumptions about what was written.
   */
  readonly meta: Record<string, unknown>
}

/** Call next() to hand control to the next middleware. Do not call it more than once. */
export type MiddlewareNext = () => Promise<void>

export type MiddlewareFunction = (
  ctx: RequestContext,
  next: MiddlewareNext,
) => Promise<void>
