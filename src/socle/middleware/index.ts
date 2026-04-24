export type { RequestContext, MiddlewareFunction, MiddlewareNext } from './middleware.types'
export type { PipelineResult } from './pipeline'
export type { CreateRequestContextOptions } from './request-context'

export { createPipeline } from './pipeline'
export { createRequestContext } from './request-context'
export { generateRequestId } from './request-id'
export { SECURITY_HEADERS, type SecurityHeaderName } from './security-headers'
export {
  createRequestLoggerMiddleware,
  requestLoggerMiddleware,
} from './request-logger'

// Next.js adapter — import from '@/socle/middleware/next-adapter' directly
// to avoid pulling Next.js types into environments that don't need them.
//
// IMPORTANT: Security headers are NOT applied automatically. Next.js projects
// must call nextResponseWithHeaders(ctx) in their middleware to apply the
// baseline SECURITY_HEADERS to every response. Omitting this call means no
// security headers will be set.
//
//   import { contextFromNextRequest, nextResponseWithHeaders } from '@/socle/middleware/next-adapter'
