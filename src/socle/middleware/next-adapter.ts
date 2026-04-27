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

// RFC 6265 cookie attributes — structurally compatible with both @supabase/ssr
// CookieOptions and Next.js ResponseCookie options (no cross-layer import needed).
interface PendingCookieOptions {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: 'strict' | 'lax' | 'none'
  secure?: boolean
}

interface PendingCookie {
  name: string
  value: string
  options: PendingCookieOptions
}

const RESPONSE_COOKIES_META_KEY = 'socle.response.cookies'
const RESPONSE_HEADERS_META_KEY = 'socle.response.headers'

/**
 * Build a RequestContext from a NextRequest.
 * Reuses an existing x-request-id header when present (e.g., from a load balancer).
 *
 * Populates `socle.request.cookies` in ctx.meta so that Socle+ middleware
 * (e.g. authMiddleware) can read and refresh session cookies without depending
 * on next/headers. Cookies written via setAll are collected into
 * `socle.response.cookies` and `socle.response.headers` and applied to the
 * final NextResponse by nextResponseWithHeaders().
 */
export function contextFromNextRequest(req: NextRequest): RequestContext {
  const existingId = req.headers.get('x-request-id')
  const pendingCookies: PendingCookie[] = []
  const pendingHeaders: Record<string, string> = {}
  return createRequestContext({
    path: req.nextUrl.pathname,
    method: req.method,
    ...(existingId !== null ? { requestId: existingId } : {}),
    meta: {
      'socle.request.cookies': {
        getAll: () => req.cookies.getAll(),
        setAll: (
          cookiesToSet: Array<{ name: string; value: string; options: PendingCookieOptions }>,
          headers: Record<string, string>,
        ) => {
          for (const cookie of cookiesToSet) {
            pendingCookies.push({ name: cookie.name, value: cookie.value, options: cookie.options })
          }
          Object.assign(pendingHeaders, headers)
        },
      },
      [RESPONSE_COOKIES_META_KEY]: pendingCookies,
      [RESPONSE_HEADERS_META_KEY]: pendingHeaders,
    },
  })
}

/**
 * Create a NextResponse that continues the request and applies:
 * - Socle baseline security headers
 * - x-request-id header for end-to-end tracing
 * - Session-refresh cookies collected during middleware execution (e.g. Supabase auth)
 * - Response headers set by middleware (e.g. cache-control from auth refresh)
 */
export function nextResponseWithHeaders(ctx: RequestContext): NextResponse {
  const response = NextResponse.next()
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value)
  }
  response.headers.set('x-request-id', ctx.requestId)

  const pendingCookies = ctx.meta[RESPONSE_COOKIES_META_KEY]
  if (Array.isArray(pendingCookies)) {
    for (const raw of pendingCookies) {
      if (isPendingCookie(raw)) {
        response.cookies.set(raw.name, raw.value, raw.options)
      }
    }
  }

  const pendingHeaders = ctx.meta[RESPONSE_HEADERS_META_KEY]
  if (typeof pendingHeaders === 'object' && pendingHeaders !== null) {
    for (const [name, value] of Object.entries(pendingHeaders as Record<string, unknown>)) {
      if (typeof value === 'string') {
        response.headers.set(name, value)
      }
    }
  }

  return response
}

function isPendingCookie(value: unknown): value is PendingCookie {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return typeof obj['name'] === 'string' && typeof obj['value'] === 'string'
}
