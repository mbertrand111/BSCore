/**
 * Next.js adapter — bridges Socle middleware to Next.js request/response types.
 * All Next.js-specific imports are isolated to this file.
 * The core pipeline and types have no Next.js dependency.
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createRequestContext } from './request-context'
import { SECURITY_HEADERS } from './security-headers'
import type { RequestContext } from './middleware.types'

/**
 * Build a RequestContext from a NextRequest.
 * Reuses an existing x-request-id header when present (e.g., from a load balancer).
 */
export function contextFromNextRequest(req: NextRequest): RequestContext {
  const existingId = req.headers.get('x-request-id')
  return createRequestContext({
    path: req.nextUrl.pathname,
    method: req.method,
    ...(existingId !== null ? { requestId: existingId } : {}),
  })
}

/**
 * Create a NextResponse that continues the request and applies:
 * - Socle baseline security headers
 * - x-request-id header for end-to-end tracing
 */
export function nextResponseWithHeaders(ctx: RequestContext): NextResponse {
  const response = NextResponse.next()
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value)
  }
  response.headers.set('x-request-id', ctx.requestId)
  return response
}
