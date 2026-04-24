import type { Logger } from '@/socle/logger'
import { logger as defaultLogger, sanitizeMeta } from '@/socle/logger'
import { toAppError, toSafeError, InternalError, type SafeError } from '@/socle/errors'
import type { MiddlewareFunction, RequestContext } from './middleware.types'

export type PipelineResult =
  | { readonly ok: true; readonly context: RequestContext }
  | { readonly ok: false; readonly error: SafeError; readonly context: RequestContext }

/**
 * Build an ordered middleware pipeline.
 *
 * Each middleware receives the shared RequestContext and a `next` function.
 * Calling next() passes control to the following middleware. Not calling next()
 * short-circuits the chain (useful for caching, early returns, etc.).
 *
 * Errors thrown by any middleware are:
 *  1. Normalized to AppError via toAppError
 *  2. Logged via the provided logger
 *  3. Returned as { ok: false, error: SafeError } — never re-thrown
 */
export function createPipeline(
  middlewares: readonly MiddlewareFunction[],
  log: Logger = defaultLogger,
): (ctx: RequestContext) => Promise<PipelineResult> {
  return async (ctx: RequestContext): Promise<PipelineResult> => {
    // index tracks the last dispatched position to detect double next() calls.
    let index = -1

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new InternalError('next() called multiple times in the same middleware')
      }
      index = i

      const fn = middlewares[i]
      if (fn === undefined) return // end of chain

      await fn(ctx, () => dispatch(i + 1))
    }

    try {
      await dispatch(0)
      return { ok: true, context: ctx }
    } catch (caught) {
      const error = toAppError(caught)
      log.error(error.message, sanitizeMeta({
        code: error.code,
        requestId: ctx.requestId,
        path: ctx.path,
        ...error.meta,
      }))
      return { ok: false, error: toSafeError(error), context: ctx }
    }
  }
}
