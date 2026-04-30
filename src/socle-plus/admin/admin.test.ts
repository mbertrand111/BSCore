import { vi, describe, it, expect, beforeEach } from 'vitest'

// Prevent server-only from throwing in Node/Vitest environment.
vi.mock('server-only', () => ({}))

// Mock Next.js internals. redirect() throws to mirror its real behaviour —
// this ensures control flow in requireAdminAuth stops at redirect calls.
vi.mock('next/headers', () => ({ cookies: vi.fn() }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw Object.assign(new Error(`NEXT_REDIRECT:${url}`), { digest: `NEXT_REDIRECT;replace;${url};` })
  }),
}))

vi.mock('@/socle-plus/auth/supabase-client', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('@/socle-plus/auth/user-roles-repository', () => ({
  getUserRole: vi.fn(),
  setUserRole: vi.fn(),
}))

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/socle-plus/auth/supabase-client'
import { getUserRole } from '@/socle-plus/auth/user-roles-repository'
import { requireAdminAuth } from './admin-guard'
import {
  registerAdminNav,
  getAdminNav,
  getGroupedAdminNav,
  clearAdminNav,
} from './admin-nav-registry'
import type { AdminNavItem } from './admin.types'
import type { AuthenticatedUser } from '@/socle-plus/auth/auth.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCookieStore(): { getAll: () => Array<{ name: string; value: string }> } {
  return { getAll: () => [] }
}

function makeSupabaseStub(
  user: { id: string; email: string } | null,
  error: unknown = null,
): { auth: { getUser: ReturnType<typeof vi.fn> } } {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  }
}

function makeAdminUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return { id: 'user-1', email: 'admin@example.com', role: 'admin', ...overrides }
}

// ---------------------------------------------------------------------------
// requireAdminAuth
// ---------------------------------------------------------------------------

describe('requireAdminAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockResolvedValue(makeCookieStore() as never)
  })

  it('returns AuthenticatedUser when Supabase session and DB role are both valid', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-1', email: 'admin@example.com' }) as never,
    )
    vi.mocked(getUserRole).mockResolvedValue('admin')

    const user = await requireAdminAuth()

    expect(user).toEqual({ id: 'user-1', email: 'admin@example.com', role: 'admin' })
  })

  it('returns super_admin role correctly', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-2', email: 'super@example.com' }) as never,
    )
    vi.mocked(getUserRole).mockResolvedValue('super_admin')

    const user = await requireAdminAuth()

    expect(user).toEqual({ id: 'user-2', email: 'super@example.com', role: 'super_admin' })
  })

  it('redirects to /login when Supabase returns an error', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub(null, { message: 'JWT expired' }) as never,
    )

    await expect(requireAdminAuth()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login')
  })

  it('redirects to /login when Supabase returns no user', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub(null) as never,
    )

    await expect(requireAdminAuth()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login')
  })

  it('redirects to /login when Supabase user has no email', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: undefined } },
          error: null,
        }),
      },
    } as never)

    await expect(requireAdminAuth()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login')
  })

  it('redirects to /login when DB has no role for the user', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub({ id: 'user-1', email: 'admin@example.com' }) as never,
    )
    vi.mocked(getUserRole).mockResolvedValue(null)

    await expect(requireAdminAuth()).rejects.toThrow('NEXT_REDIRECT:/login')
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login')
  })

  it('does not call getUserRole when Supabase auth fails', async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue(
      makeSupabaseStub(null, { message: 'expired' }) as never,
    )

    await expect(requireAdminAuth()).rejects.toThrow()
    expect(vi.mocked(getUserRole)).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Admin nav registry
// ---------------------------------------------------------------------------

describe('registerAdminNav / getAdminNav / clearAdminNav', () => {
  beforeEach(() => {
    clearAdminNav()
  })

  const itemAdmin: AdminNavItem = { label: 'Dashboard', href: '/admin', requiredRole: 'admin' }
  const itemSuperAdmin: AdminNavItem = { label: 'Users', href: '/admin/users', requiredRole: 'super_admin' }
  const itemAdmin2: AdminNavItem = { label: 'Content', href: '/admin/content', requiredRole: 'admin' }

  it('returns empty array when no items are registered', () => {
    expect(getAdminNav(makeAdminUser())).toEqual([])
  })

  it('returns registered item for a user with sufficient role', () => {
    registerAdminNav(itemAdmin)
    expect(getAdminNav(makeAdminUser())).toEqual([itemAdmin])
  })

  it('admin user sees admin items', () => {
    registerAdminNav(itemAdmin)
    expect(getAdminNav(makeAdminUser({ role: 'admin' }))).toEqual([itemAdmin])
  })

  it('admin user does not see super_admin items', () => {
    registerAdminNav(itemSuperAdmin)
    expect(getAdminNav(makeAdminUser({ role: 'admin' }))).toEqual([])
  })

  it('super_admin user sees all items', () => {
    registerAdminNav(itemAdmin)
    registerAdminNav(itemSuperAdmin)
    const items = getAdminNav(makeAdminUser({ role: 'super_admin' }))
    expect(items).toContainEqual(itemAdmin)
    expect(items).toContainEqual(itemSuperAdmin)
    expect(items).toHaveLength(2)
  })

  it('returns items in registration order', () => {
    registerAdminNav(itemAdmin)
    registerAdminNav(itemAdmin2)
    expect(getAdminNav(makeAdminUser())).toEqual([itemAdmin, itemAdmin2])
  })

  it('duplicate href is ignored — idempotent registration', () => {
    registerAdminNav(itemAdmin)
    registerAdminNav({ ...itemAdmin, label: 'Different label' })
    expect(getAdminNav(makeAdminUser())).toHaveLength(1)
    expect(getAdminNav(makeAdminUser())[0]?.label).toBe('Dashboard')
  })

  it('clearAdminNav removes all items', () => {
    registerAdminNav(itemAdmin)
    registerAdminNav(itemSuperAdmin)
    clearAdminNav()
    expect(getAdminNav(makeAdminUser({ role: 'super_admin' }))).toEqual([])
  })

  it('can re-register items after clearing', () => {
    registerAdminNav(itemAdmin)
    clearAdminNav()
    registerAdminNav(itemAdmin)
    expect(getAdminNav(makeAdminUser())).toEqual([itemAdmin])
  })

  it('filters mixed items correctly for admin role', () => {
    registerAdminNav(itemAdmin)
    registerAdminNav(itemSuperAdmin)
    registerAdminNav(itemAdmin2)
    const items = getAdminNav(makeAdminUser({ role: 'admin' }))
    expect(items).toEqual([itemAdmin, itemAdmin2])
  })

  it('includes items with icon when icon is set', () => {
    const itemWithIcon: AdminNavItem = { label: 'Settings', href: '/admin/settings', icon: '⚙', requiredRole: 'admin' }
    registerAdminNav(itemWithIcon)
    expect(getAdminNav(makeAdminUser())).toEqual([itemWithIcon])
  })

  it('does not mutate the original item reference', () => {
    const original = { ...itemAdmin }
    registerAdminNav(itemAdmin)
    const result = getAdminNav(makeAdminUser())
    expect(result[0]).toBe(itemAdmin)
    expect(original).toEqual(itemAdmin)
  })
})

// ---------------------------------------------------------------------------
// getGroupedAdminNav — sectioned + count-resolving variant
// ---------------------------------------------------------------------------

describe('getGroupedAdminNav', () => {
  beforeEach(() => {
    clearAdminNav()
  })

  it('returns empty array when no items are registered', async () => {
    const groups = await getGroupedAdminNav(makeAdminUser())
    expect(groups).toEqual([])
  })

  it('groups items into Vue → Contenu → Engagement → Système order', async () => {
    registerAdminNav({ label: 'Settings',  href: '/admin/settings', requiredRole: 'admin', section: 'system' })
    registerAdminNav({ label: 'CMS',       href: '/admin/cms',      requiredRole: 'admin', section: 'content' })
    registerAdminNav({ label: 'Dashboard', href: '/admin',          requiredRole: 'admin', section: 'view' })
    registerAdminNav({ label: 'Bookings',  href: '/admin/bookings', requiredRole: 'admin', section: 'engagement' })

    const groups = await getGroupedAdminNav(makeAdminUser())

    expect(groups.map((g) => g.section)).toEqual(['view', 'content', 'engagement', 'system'])
    expect(groups.map((g) => g.items.map((i) => i.label))).toEqual([
      ['Dashboard'],
      ['CMS'],
      ['Bookings'],
      ['Settings'],
    ])
  })

  it('drops empty sections', async () => {
    registerAdminNav({ label: 'CMS', href: '/admin/cms', requiredRole: 'admin', section: 'content' })

    const groups = await getGroupedAdminNav(makeAdminUser())

    expect(groups).toHaveLength(1)
    expect(groups[0]?.section).toBe('content')
  })

  it('defaults section-less items to content', async () => {
    registerAdminNav({ label: 'SEO', href: '/admin/seo', requiredRole: 'admin' })

    const groups = await getGroupedAdminNav(makeAdminUser())

    expect(groups).toHaveLength(1)
    expect(groups[0]?.section).toBe('content')
    expect(groups[0]?.items[0]?.label).toBe('SEO')
  })

  it('filters by role hierarchy', async () => {
    registerAdminNav({ label: 'Roles', href: '/admin/roles', requiredRole: 'super_admin', section: 'system' })

    const groups = await getGroupedAdminNav(makeAdminUser({ role: 'admin' }))

    expect(groups).toEqual([])
  })

  it('resolves count callbacks in parallel', async () => {
    const cmsCount = vi.fn().mockResolvedValue(2)
    const mediaCount = vi.fn().mockResolvedValue(14)
    registerAdminNav({ label: 'CMS',    href: '/admin/cms',   requiredRole: 'admin', section: 'content', count: cmsCount })
    registerAdminNav({ label: 'Médias', href: '/admin/media', requiredRole: 'admin', section: 'content', count: mediaCount })

    const groups = await getGroupedAdminNav(makeAdminUser())

    expect(cmsCount).toHaveBeenCalledTimes(1)
    expect(mediaCount).toHaveBeenCalledTimes(1)
    const items = groups[0]?.items ?? []
    expect(items.find((i) => i.label === 'CMS')?.count).toBe(2)
    expect(items.find((i) => i.label === 'Médias')?.count).toBe(14)
  })

  it('omits the badge when a count callback throws', async () => {
    const flaky = vi.fn().mockRejectedValue(new Error('db down'))
    registerAdminNav({ label: 'CMS', href: '/admin/cms', requiredRole: 'admin', section: 'content', count: flaky })

    const groups = await getGroupedAdminNav(makeAdminUser())

    const item = groups[0]?.items[0]
    expect(item?.label).toBe('CMS')
    expect(item?.count).toBeUndefined()
  })

  it('strips the count function from the resolved item', async () => {
    registerAdminNav({
      label: 'CMS',
      href: '/admin/cms',
      requiredRole: 'admin',
      section: 'content',
      count: () => Promise.resolve(7),
    })

    const groups = await getGroupedAdminNav(makeAdminUser())

    const item = groups[0]?.items[0] as Record<string, unknown> | undefined
    expect(item).toBeDefined()
    expect(typeof item?.count).toBe('number')
    // Resolved items expose count as a number, never the original function.
    expect(typeof item?.count).not.toBe('function')
  })
})
