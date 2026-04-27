import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { RequestContext } from '@/socle/middleware'
import { UnauthorizedError, ForbiddenError } from '@/socle/errors'
import { getAuthUser, requireAuthUser, authMiddleware } from './auth-middleware'
import type { AuthUser, CookieStore } from './auth.types'

// Mock the Supabase client factory so tests never make real network calls.
vi.mock('./supabase-client')
import { createSupabaseServerClient } from './supabase-client'

// Mock the role repository with an explicit factory to prevent the real module
// from loading (which would transitively import db-client and trigger the
// DATABASE_URL fail-fast check at module initialisation time).
vi.mock('./user-roles-repository', () => ({
  getUserRole: vi.fn(),
  setUserRole: vi.fn(),
}))
import { getUserRole } from './user-roles-repository'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeCtx(meta: Record<string, unknown> = {}): RequestContext {
  return { requestId: 'test-id', timestamp: new Date(), path: '/test', method: 'GET', meta }
}

function makeCookieStore(): CookieStore {
  return {
    getAll: () => [],
    setAll: () => {},
  }
}

type PartialSupabaseClient = {
  auth: { getUser: ReturnType<typeof vi.fn> }
}

function makeSupabaseStub(user: { id: string; email: string } | null): PartialSupabaseClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user === null ? { message: 'JWT expired' } : null,
      }),
    },
  }
}

// ---------------------------------------------------------------------------
// getAuthUser
// ---------------------------------------------------------------------------

describe('getAuthUser', () => {
  it('returns null when no user is in ctx.meta', () => {
    const ctx = makeCtx()
    expect(getAuthUser(ctx)).toBeNull()
  })

  it('returns null when meta value is not an object', () => {
    const ctx = makeCtx({ 'socle.user': 'string-value' })
    expect(getAuthUser(ctx)).toBeNull()
  })

  it('returns null when meta object is missing required fields', () => {
    const ctx = makeCtx({ 'socle.user': { id: 'only-id' } })
    expect(getAuthUser(ctx)).toBeNull()
  })

  it('returns null when id is not a string', () => {
    const ctx = makeCtx({ 'socle.user': { id: 42, email: 'x@x.com' } })
    expect(getAuthUser(ctx)).toBeNull()
  })

  it('returns the AuthUser when a valid user without role is in ctx.meta', () => {
    const user: AuthUser = { id: 'user-1', email: 'test@example.com' }
    const ctx = makeCtx({ 'socle.user': user })
    expect(getAuthUser(ctx)).toEqual(user)
  })

  it('returns the AuthUser when a valid user with role is in ctx.meta', () => {
    const user: AuthUser = { id: 'user-1', email: 'test@example.com', role: 'admin' }
    const ctx = makeCtx({ 'socle.user': user })
    expect(getAuthUser(ctx)).toEqual(user)
  })
})

// ---------------------------------------------------------------------------
// requireAuthUser
// ---------------------------------------------------------------------------

describe('requireAuthUser', () => {
  it('throws UnauthorizedError when no user is in meta', () => {
    const ctx = makeCtx()
    expect(() => requireAuthUser(ctx)).toThrow(UnauthorizedError)
  })

  it('thrown error has the expected message', () => {
    const ctx = makeCtx()
    expect(() => requireAuthUser(ctx)).toThrow('Authentication required')
  })

  it('returns AuthUser when a valid user is present', () => {
    const user: AuthUser = { id: 'user-1', email: 'test@example.com', role: 'admin' }
    const ctx = makeCtx({ 'socle.user': user })
    expect(requireAuthUser(ctx)).toEqual(user)
  })
})

// ---------------------------------------------------------------------------
// authMiddleware
// ---------------------------------------------------------------------------

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls next() when no cookies are present in ctx.meta', async () => {
    const ctx = makeCtx()
    const next = vi.fn().mockResolvedValue(undefined)
    await authMiddleware(ctx, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('leaves user unset when no cookies are present', async () => {
    const ctx = makeCtx()
    await authMiddleware(ctx, vi.fn().mockResolvedValue(undefined))
    expect(ctx.meta['socle.user']).toBeUndefined()
  })

  it('does not call getUserRole when no cookies are present', async () => {
    const ctx = makeCtx()
    await authMiddleware(ctx, vi.fn().mockResolvedValue(undefined))
    expect(vi.mocked(getUserRole)).not.toHaveBeenCalled()
  })

  it('attaches user with role when Supabase and DB both succeed', async () => {
    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    const next = vi.fn().mockResolvedValue(undefined)
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-1', email: 'test@example.com' }) as unknown as ReturnType<
        typeof createSupabaseServerClient
      >,
    )
    vi.mocked(getUserRole).mockResolvedValue('admin')

    await authMiddleware(ctx, next)

    expect(next).toHaveBeenCalledOnce()
    expect(ctx.meta['socle.user']).toEqual({ id: 'user-1', email: 'test@example.com', role: 'admin' })
  })

  it('attaches user with super_admin role when DB returns super_admin', async () => {
    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-2', email: 'admin@example.com' }) as unknown as ReturnType<
        typeof createSupabaseServerClient
      >,
    )
    vi.mocked(getUserRole).mockResolvedValue('super_admin')

    await authMiddleware(ctx, vi.fn().mockResolvedValue(undefined))

    expect(ctx.meta['socle.user']).toEqual({ id: 'user-2', email: 'admin@example.com', role: 'super_admin' })
  })

  it('leaves user unset when Supabase returns a valid user but DB has no role', async () => {
    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-1', email: 'test@example.com' }) as unknown as ReturnType<
        typeof createSupabaseServerClient
      >,
    )
    vi.mocked(getUserRole).mockResolvedValue(null)

    await authMiddleware(ctx, vi.fn().mockResolvedValue(undefined))

    expect(ctx.meta['socle.user']).toBeUndefined()
  })

  it('leaves user unset when getUserRole throws', async () => {
    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    const next = vi.fn().mockResolvedValue(undefined)
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-1', email: 'test@example.com' }) as unknown as ReturnType<
        typeof createSupabaseServerClient
      >,
    )
    vi.mocked(getUserRole).mockRejectedValue(new Error('DB connection lost'))

    await authMiddleware(ctx, next)

    expect(next).toHaveBeenCalledOnce()
    expect(ctx.meta['socle.user']).toBeUndefined()
  })

  it('calls next() without user when Supabase returns no active session', async () => {
    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    const next = vi.fn().mockResolvedValue(undefined)
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub(null) as unknown as ReturnType<typeof createSupabaseServerClient>,
    )

    await authMiddleware(ctx, next)

    expect(next).toHaveBeenCalledOnce()
    expect(ctx.meta['socle.user']).toBeUndefined()
    expect(vi.mocked(getUserRole)).not.toHaveBeenCalled()
  })

  it('calls next() and leaves user unset when createSupabaseServerClient throws', async () => {
    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    const next = vi.fn().mockResolvedValue(undefined)
    vi.mocked(createSupabaseServerClient).mockImplementation(() => {
      throw new Error('SUPABASE_URL not set')
    })

    await authMiddleware(ctx, next)

    expect(next).toHaveBeenCalledOnce()
    expect(ctx.meta['socle.user']).toBeUndefined()
  })

  it('calls next() and leaves user unset when getUser() rejects', async () => {
    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    const next = vi.fn().mockResolvedValue(undefined)
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: { getUser: vi.fn().mockRejectedValue(new Error('network error')) },
    } as unknown as ReturnType<typeof createSupabaseServerClient>)

    await authMiddleware(ctx, next)

    expect(next).toHaveBeenCalledOnce()
    expect(ctx.meta['socle.user']).toBeUndefined()
  })

  it('skips user when Supabase user has no email', async () => {
    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: undefined } },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createSupabaseServerClient>)

    await authMiddleware(ctx, vi.fn().mockResolvedValue(undefined))

    expect(ctx.meta['socle.user']).toBeUndefined()
    expect(vi.mocked(getUserRole)).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// RBAC composition — auth middleware → authorization middleware
// ---------------------------------------------------------------------------

describe('RBAC composition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requireAuth() passes after auth middleware attaches a user with role', async () => {
    const { requireAuth } = await import('@/socle-plus/authorization')

    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-1', email: 'test@example.com' }) as unknown as ReturnType<
        typeof createSupabaseServerClient
      >,
    )
    vi.mocked(getUserRole).mockResolvedValue('admin')

    await authMiddleware(ctx, vi.fn().mockResolvedValue(undefined))

    const authNext = vi.fn().mockResolvedValue(undefined)
    await requireAuth()(ctx, authNext)
    expect(authNext).toHaveBeenCalledOnce()
  })

  it('requireAuth() throws when auth middleware found no role for the user', async () => {
    const { requireAuth } = await import('@/socle-plus/authorization')

    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-1', email: 'test@example.com' }) as unknown as ReturnType<
        typeof createSupabaseServerClient
      >,
    )
    vi.mocked(getUserRole).mockResolvedValue(null)

    await authMiddleware(ctx, vi.fn().mockResolvedValue(undefined))

    await expect(requireAuth()(ctx, vi.fn())).rejects.toThrow(UnauthorizedError)
  })

  it('requireRole("super_admin") throws ForbiddenError for an admin user', async () => {
    const { requireRole } = await import('@/socle-plus/authorization')

    const ctx = makeCtx({ 'socle.request.cookies': makeCookieStore() })
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-1', email: 'test@example.com' }) as unknown as ReturnType<
        typeof createSupabaseServerClient
      >,
    )
    vi.mocked(getUserRole).mockResolvedValue('admin')

    await authMiddleware(ctx, vi.fn().mockResolvedValue(undefined))

    await expect(requireRole('super_admin')(ctx, vi.fn())).rejects.toThrow(ForbiddenError)
  })
})
