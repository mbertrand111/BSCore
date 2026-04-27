import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { RequestContext } from '@/socle/middleware'
import { UnauthorizedError, ForbiddenError } from '@/socle/errors'
import { declarePermissions, clearPermissions } from './permission-registry'
import { can } from './can'
import { getAuthUser, requireAuthUser, requireAuth, requireRole } from './authorization-middleware'
import type { AuthenticatedUser } from './authorization.types'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeCtx(meta: Record<string, unknown> = {}): RequestContext {
  return { requestId: 'test-id', timestamp: new Date(), path: '/test', method: 'GET', meta }
}

function makeUser(role: 'admin' | 'super_admin'): AuthenticatedUser {
  return { id: 'user-1', email: 'test@example.com', role }
}

// ---------------------------------------------------------------------------
// Permission registry
// ---------------------------------------------------------------------------

describe('declarePermissions', () => {
  beforeEach(() => {
    clearPermissions()
  })

  it('allows declared actions after registration', () => {
    declarePermissions('posts', { admin: ['read', 'create'] })
    const user = makeUser('admin')
    expect(can(user, 'read', 'posts')).toBe(true)
    expect(can(user, 'create', 'posts')).toBe(true)
  })

  it('merges subsequent declarations for the same resource additively', () => {
    declarePermissions('posts', { admin: ['read'] })
    declarePermissions('posts', { admin: ['create'] })
    const user = makeUser('admin')
    expect(can(user, 'read', 'posts')).toBe(true)
    expect(can(user, 'create', 'posts')).toBe(true)
  })

  it('deduplicates duplicate action declarations without error', () => {
    declarePermissions('posts', { admin: ['read'] })
    declarePermissions('posts', { admin: ['read', 'create'] })
    const user = makeUser('admin')
    expect(can(user, 'read', 'posts')).toBe(true)
    expect(can(user, 'create', 'posts')).toBe(true)
    expect(can(user, 'delete', 'posts')).toBe(false)
  })

  it('supports declaring permissions for multiple roles on the same resource', () => {
    declarePermissions('posts', {
      admin: ['read', 'create'],
      super_admin: ['manage'],
    })
    expect(can(makeUser('admin'), 'read', 'posts')).toBe(true)
    expect(can(makeUser('admin'), 'delete', 'posts')).toBe(false)
    expect(can(makeUser('super_admin'), 'delete', 'posts')).toBe(true)
  })

  it('isolates permissions across different resources', () => {
    declarePermissions('posts', { admin: ['read'] })
    declarePermissions('comments', { admin: ['delete'] })
    const user = makeUser('admin')
    expect(can(user, 'read', 'posts')).toBe(true)
    expect(can(user, 'delete', 'posts')).toBe(false)
    expect(can(user, 'delete', 'comments')).toBe(true)
    expect(can(user, 'read', 'comments')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// can()
// ---------------------------------------------------------------------------

describe('can()', () => {
  beforeEach(() => {
    clearPermissions()
    declarePermissions('posts', { admin: ['read', 'create'] })
  })

  it('returns true for super_admin on any declared action', () => {
    expect(can(makeUser('super_admin'), 'read', 'posts')).toBe(true)
    expect(can(makeUser('super_admin'), 'create', 'posts')).toBe(true)
  })

  it('returns true for super_admin on undeclared actions', () => {
    expect(can(makeUser('super_admin'), 'delete', 'posts')).toBe(true)
    expect(can(makeUser('super_admin'), 'manage', 'posts')).toBe(true)
  })

  it('returns true for super_admin on entirely undeclared resources', () => {
    expect(can(makeUser('super_admin'), 'read', 'undeclared-resource')).toBe(true)
  })

  it('returns true for admin on declared actions', () => {
    expect(can(makeUser('admin'), 'read', 'posts')).toBe(true)
    expect(can(makeUser('admin'), 'create', 'posts')).toBe(true)
  })

  it('returns false for admin on undeclared actions', () => {
    expect(can(makeUser('admin'), 'delete', 'posts')).toBe(false)
    expect(can(makeUser('admin'), 'update', 'posts')).toBe(false)
  })

  it('returns false for admin on an undeclared resource', () => {
    expect(can(makeUser('admin'), 'read', 'comments')).toBe(false)
  })

  it('returns true for admin on all actions when manage is declared', () => {
    clearPermissions()
    declarePermissions('posts', { admin: ['manage'] })
    const user = makeUser('admin')
    expect(can(user, 'read', 'posts')).toBe(true)
    expect(can(user, 'create', 'posts')).toBe(true)
    expect(can(user, 'update', 'posts')).toBe(true)
    expect(can(user, 'delete', 'posts')).toBe(true)
    expect(can(user, 'manage', 'posts')).toBe(true)
  })

  it('manage does not bleed across resources', () => {
    clearPermissions()
    declarePermissions('posts', { admin: ['manage'] })
    declarePermissions('comments', { admin: ['read'] })
    expect(can(makeUser('admin'), 'delete', 'posts')).toBe(true)
    expect(can(makeUser('admin'), 'delete', 'comments')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getAuthUser()
// ---------------------------------------------------------------------------

describe('getAuthUser()', () => {
  it('returns null when meta has no user', () => {
    expect(getAuthUser(makeCtx())).toBeNull()
  })

  it('returns null when meta value is not an object', () => {
    expect(getAuthUser(makeCtx({ 'socle.user': 'string-value' }))).toBeNull()
  })

  it('returns null when meta user is missing the role field', () => {
    expect(getAuthUser(makeCtx({ 'socle.user': { id: 'x', email: 'x@x.com' } }))).toBeNull()
  })

  it('returns null when meta user has an unrecognised role', () => {
    expect(
      getAuthUser(makeCtx({ 'socle.user': { id: 'x', email: 'x@x.com', role: 'editor' } })),
    ).toBeNull()
  })

  it('returns AuthenticatedUser when a valid admin user is present', () => {
    const user = makeUser('admin')
    expect(getAuthUser(makeCtx({ 'socle.user': user }))).toEqual(user)
  })

  it('returns AuthenticatedUser when a valid super_admin user is present', () => {
    const user = makeUser('super_admin')
    expect(getAuthUser(makeCtx({ 'socle.user': user }))).toEqual(user)
  })
})

// ---------------------------------------------------------------------------
// requireAuthUser()
// ---------------------------------------------------------------------------

describe('requireAuthUser()', () => {
  it('throws UnauthorizedError when no user is in meta', () => {
    expect(() => requireAuthUser(makeCtx())).toThrow(UnauthorizedError)
  })

  it('thrown error has the expected message', () => {
    expect(() => requireAuthUser(makeCtx())).toThrow('Authentication required')
  })

  it('returns AuthenticatedUser when a valid user is present', () => {
    const user = makeUser('super_admin')
    expect(requireAuthUser(makeCtx({ 'socle.user': user }))).toEqual(user)
  })
})

// ---------------------------------------------------------------------------
// requireAuth()
// ---------------------------------------------------------------------------

describe('requireAuth()', () => {
  it('throws UnauthorizedError when no user is in meta', async () => {
    const middleware = requireAuth()
    await expect(middleware(makeCtx(), vi.fn())).rejects.toThrow(UnauthorizedError)
  })

  it('does not call next() when throwing', async () => {
    const middleware = requireAuth()
    const next = vi.fn()
    await expect(middleware(makeCtx(), next)).rejects.toThrow()
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() when an admin user is present', async () => {
    const middleware = requireAuth()
    const ctx = makeCtx({ 'socle.user': makeUser('admin') })
    const next = vi.fn().mockResolvedValue(undefined)
    await middleware(ctx, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('calls next() when a super_admin user is present', async () => {
    const middleware = requireAuth()
    const ctx = makeCtx({ 'socle.user': makeUser('super_admin') })
    const next = vi.fn().mockResolvedValue(undefined)
    await middleware(ctx, next)
    expect(next).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// requireRole()
// ---------------------------------------------------------------------------

describe('requireRole()', () => {
  it('throws UnauthorizedError when no user is in meta', async () => {
    const middleware = requireRole('admin')
    await expect(middleware(makeCtx(), vi.fn())).rejects.toThrow(UnauthorizedError)
  })

  it('throws ForbiddenError when the user role is below the minimum', async () => {
    const middleware = requireRole('super_admin')
    const ctx = makeCtx({ 'socle.user': makeUser('admin') })
    await expect(middleware(ctx, vi.fn())).rejects.toThrow(ForbiddenError)
  })

  it('thrown ForbiddenError is not an UnauthorizedError', async () => {
    const middleware = requireRole('super_admin')
    const ctx = makeCtx({ 'socle.user': makeUser('admin') })
    let thrown: unknown
    try {
      await middleware(ctx, vi.fn())
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(ForbiddenError)
    expect(thrown).not.toBeInstanceOf(UnauthorizedError)
  })

  it('calls next() when user role exactly matches the minimum', async () => {
    const middleware = requireRole('admin')
    const ctx = makeCtx({ 'socle.user': makeUser('admin') })
    const next = vi.fn().mockResolvedValue(undefined)
    await middleware(ctx, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('calls next() when user role is higher than the minimum', async () => {
    const middleware = requireRole('admin')
    const ctx = makeCtx({ 'socle.user': makeUser('super_admin') })
    const next = vi.fn().mockResolvedValue(undefined)
    await middleware(ctx, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('calls next() when super_admin meets requireRole("super_admin")', async () => {
    const middleware = requireRole('super_admin')
    const ctx = makeCtx({ 'socle.user': makeUser('super_admin') })
    const next = vi.fn().mockResolvedValue(undefined)
    await middleware(ctx, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('does not call next() when throwing ForbiddenError', async () => {
    const middleware = requireRole('super_admin')
    const ctx = makeCtx({ 'socle.user': makeUser('admin') })
    const next = vi.fn()
    await expect(middleware(ctx, next)).rejects.toThrow(ForbiddenError)
    expect(next).not.toHaveBeenCalled()
  })
})
