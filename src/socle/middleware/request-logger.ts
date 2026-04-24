import type { Logger } from '@/socle/logger'
import { logger as defaultLogger } from '@/socle/logger'
import type { MiddlewareFunction } from './middleware.types'

/**
 * Create a request logging middleware bound to a specific Logger instance.
 * Logs the incoming request before the chain and the completed request after.
 */
export function createRequestLoggerMiddleware(log: Logger): MiddlewareFunction {
  return async (ctx, next) => {
    log.info('request started', {
      requestId: ctx.requestId,
      method: ctx.method,
      path: ctx.path,
    })

    const start = Date.now()
    await next()

    log.info('request completed', {
      requestId: ctx.requestId,
      method: ctx.method,
      path: ctx.path,
      durationMs: Date.now() - start,
    })
  }
}

/** Ready-to-use request logger using the default Socle logger singleton. */
export const requestLoggerMiddleware: MiddlewareFunction =
  createRequestLoggerMiddleware(defaultLogger)
