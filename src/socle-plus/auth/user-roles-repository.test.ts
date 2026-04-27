import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the db module so this test never requires DATABASE_URL.
vi.mock('@/socle-plus/database/db-client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

import { db } from '@/socle-plus/database/db-client'
import { getUserRole, setUserRole } from './user-roles-repository'

// ---------------------------------------------------------------------------
// Helpers to build Drizzle query builder chain mocks
// ---------------------------------------------------------------------------

function mockSelectChain(rows: Array<{ role: string }>): { limitFn: ReturnType<typeof vi.fn>; whereFn: ReturnType<typeof vi.fn>; fromFn: ReturnType<typeof vi.fn> } {
  const limitFn = vi.fn().mockResolvedValue(rows)
  const whereFn = vi.fn().mockReturnValue({ limit: limitFn })
  const fromFn = vi.fn().mockReturnValue({ where: whereFn })
  vi.mocked(db.select).mockReturnValue({ from: fromFn } as never)
  return { limitFn, whereFn, fromFn }
}

function mockInsertChain(): { onConflictFn: ReturnType<typeof vi.fn>; valuesFn: ReturnType<typeof vi.fn> } {
  const onConflictFn = vi.fn().mockResolvedValue(undefined)
  const valuesFn = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictFn })
  vi.mocked(db.insert).mockReturnValue({ values: valuesFn } as never)
  return { onConflictFn, valuesFn }
}

// ---------------------------------------------------------------------------
// getUserRole
// ---------------------------------------------------------------------------

describe('getUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no row is found', async () => {
    mockSelectChain([])
    expect(await getUserRole('00000000-0000-0000-0000-000000000001')).toBeNull()
  })

  it('returns admin when the stored role is admin', async () => {
    mockSelectChain([{ role: 'admin' }])
    expect(await getUserRole('00000000-0000-0000-0000-000000000001')).toBe('admin')
  })

  it('returns super_admin when the stored role is super_admin', async () => {
    mockSelectChain([{ role: 'super_admin' }])
    expect(await getUserRole('00000000-0000-0000-0000-000000000002')).toBe('super_admin')
  })

  it('returns null for an unrecognised stored role value', async () => {
    mockSelectChain([{ role: 'unknown-role' }])
    expect(await getUserRole('00000000-0000-0000-0000-000000000001')).toBeNull()
  })

  it('passes the userId to the where clause', async () => {
    const { whereFn } = mockSelectChain([])
    await getUserRole('00000000-0000-0000-0000-000000000099')
    expect(whereFn).toHaveBeenCalledOnce()
  })

  it('limits the query to 1 row', async () => {
    const { limitFn } = mockSelectChain([])
    await getUserRole('00000000-0000-0000-0000-000000000001')
    expect(limitFn).toHaveBeenCalledWith(1)
  })
})

// ---------------------------------------------------------------------------
// setUserRole
// ---------------------------------------------------------------------------

describe('setUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls insert with correct userId and role', async () => {
    const { valuesFn } = mockInsertChain()
    await setUserRole('00000000-0000-0000-0000-000000000001', 'admin')
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: '00000000-0000-0000-0000-000000000001', role: 'admin' }),
    )
  })

  it('uses onConflictDoUpdate for upsert behaviour', async () => {
    const { onConflictFn } = mockInsertChain()
    await setUserRole('00000000-0000-0000-0000-000000000001', 'admin')
    expect(onConflictFn).toHaveBeenCalledOnce()
  })

  it('resolves without throwing for a valid role', async () => {
    mockInsertChain()
    await expect(setUserRole('00000000-0000-0000-0000-000000000001', 'super_admin')).resolves.not.toThrow()
  })
})
