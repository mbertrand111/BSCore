import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import { contextFromNextRequest, nextResponseWithHeaders } from '@/socle/middleware/next-adapter'
import { getEnv } from '@/socle/config/env'
import { createSupabaseServerClient } from '@/socle-plus/auth/supabase-client'
import type { CookieStore } from '@/socle-plus/auth/auth.types'

/**
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Responsibilities:
 *   1. Supabase session cookie refresh: rotates auth tokens so sessions stay alive
 *      across requests without requiring re-login. Skipped when SUPABASE_URL /
 *      SUPABASE_ANON_KEY are not set (Socle-only projects).
 *   2. Baseline security headers (X-Frame-Options, X-Content-Type-Options, etc.)
 *      via nextResponseWithHeaders().
 *   3. x-request-id propagation for end-to-end tracing.
 *
 * NOT responsible for auth enforcement.
 *   - Admin route protection  → requireAdminAuth() in src/app/admin/layout.tsx
 *   - Module route protection → requireAuthUser() in each module's route handler
 *
 * Why no authMiddleware here:
 *   authMiddleware queries PostgreSQL (user_roles table). PostgreSQL drivers
 *   require Node.js TCP sockets which are unavailable in the Edge Runtime.
 *   Cookie refresh (HTTP-only Supabase call) is Edge-compatible; DB queries are not.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const ctx = contextFromNextRequest(request)

  // Supabase session refresh.
  // getUser() validates the current JWT and, when the token is near expiry, Supabase
  // issues a new one. The new token arrives via the setAll() callback registered
  // inside contextFromNextRequest() and is flushed to the response by
  // nextResponseWithHeaders() below. Without this call, sessions silently expire.
  const supabaseUrl = getEnv('SUPABASE_URL')
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY')

  if (supabaseUrl && supabaseAnonKey) {
    const cookieStore = ctx.meta['socle.request.cookies']
    if (isCookieStore(cookieStore)) {
      const supabase = createSupabaseServerClient(cookieStore)
      // Result intentionally unused — we only care about the cookie side-effect.
      await supabase.auth.getUser()
    }
  }

  // Returns NextResponse.next() with security headers, x-request-id,
  // and any refreshed session cookies collected during the call above.
  return nextResponseWithHeaders(ctx)
}

function isCookieStore(value: unknown): value is CookieStore {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['getAll'] === 'function'
  )
}

export const config = {
  matcher: [
    /*
     * Run on all paths except Next.js internal static assets.
     * This pattern excludes _next/static, _next/image, and favicon.ico
     * while covering all app routes, API routes, and the admin shell.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
