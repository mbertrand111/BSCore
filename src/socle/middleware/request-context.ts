import type { RequestContext } from './middleware.types'
import { generateRequestId } from './request-id'

export interface CreateRequestContextOptions {
  readonly path: string
  readonly method: string
  /** If omitted, a new request ID is generated. */
  readonly requestId?: string
  /** Initial meta entries. Shallow-copied so mutations don't leak back to the caller. */
  readonly meta?: Record<string, unknown>
}

export function createRequestContext(
  options: CreateRequestContextOptions,
): RequestContext {
  return {
    requestId: options.requestId ?? generateRequestId(),
    timestamp: new Date(),
    path: options.path,
    method: options.method.toUpperCase(),
    meta: { ...(options.meta ?? {}) },
  }
}
