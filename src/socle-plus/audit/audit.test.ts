import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/socle-plus/database/db-client', () => ({
  db: { insert: vi.fn() },
}))

vi.mock('@/socle/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

import { db } from '@/socle-plus/database/db-client'
import { logger } from '@/socle/logger'
import { writeAuditEvent } from './audit-service'
import { AUDIT_EVENTS } from './audit-events'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockInsertChain(): { valuesFn: ReturnType<typeof vi.fn> } {
  const valuesFn = vi.fn().mockResolvedValue(undefined)
  vi.mocked(db.insert).mockReturnValue({ values: valuesFn } as never)
  return { valuesFn }
}

function mockInsertFailure(message = 'DB connection lost'): void {
  const valuesFn = vi.fn().mockRejectedValue(new Error(message))
  vi.mocked(db.insert).mockReturnValue({ values: valuesFn } as never)
}

// ---------------------------------------------------------------------------
// writeAuditEvent
// ---------------------------------------------------------------------------

describe('writeAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls db.insert with the correct event name', async () => {
    const { valuesFn } = mockInsertChain()
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED)
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'user.role_changed' }),
    )
  })

  it('sets userId when provided', async () => {
    const { valuesFn } = mockInsertChain()
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED, {
      userId: '00000000-0000-0000-0000-000000000001',
    })
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: '00000000-0000-0000-0000-000000000001' }),
    )
  })

  it('sets actorId when provided', async () => {
    const { valuesFn } = mockInsertChain()
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED, {
      actorId: '00000000-0000-0000-0000-000000000002',
    })
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: '00000000-0000-0000-0000-000000000002' }),
    )
  })

  it('sets meta when provided', async () => {
    const { valuesFn } = mockInsertChain()
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED, {
      meta: { from: 'admin', to: 'super_admin' },
    })
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ meta: { from: 'admin', to: 'super_admin' } }),
    )
  })

  it('sets userId and actorId to null when not provided', async () => {
    const { valuesFn } = mockInsertChain()
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION)
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, actorId: null }),
    )
  })

  it('sets meta to null when not provided', async () => {
    const { valuesFn } = mockInsertChain()
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION)
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ meta: null }),
    )
  })

  it('accepts null userId explicitly', async () => {
    const { valuesFn } = mockInsertChain()
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_REVOKED, { userId: null })
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
    )
  })

  it('accepts a custom event string not in AUDIT_EVENTS', async () => {
    const { valuesFn } = mockInsertChain()
    await writeAuditEvent('custom.event.name')
    expect(valuesFn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'custom.event.name' }),
    )
  })

  it('does not throw when the DB insert fails', async () => {
    mockInsertFailure('connection timeout')
    await expect(writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED)).resolves.not.toThrow()
  })

  it('calls logger.error when the DB insert fails', async () => {
    mockInsertFailure('connection timeout')
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED)
    expect(vi.mocked(logger.error)).toHaveBeenCalledOnce()
  })

  it('includes the event name in the error log', async () => {
    mockInsertFailure()
    await writeAuditEvent('user.role_changed')
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: 'user.role_changed' }),
    )
  })

  it('does not call db.insert more than once per call (no retry)', async () => {
    mockInsertFailure()
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED)
    expect(vi.mocked(db.insert)).toHaveBeenCalledOnce()
  })

  it('resolves successfully with all optional fields provided', async () => {
    mockInsertChain()
    await expect(
      writeAuditEvent(AUDIT_EVENTS.USER_ROLE_ASSIGNED, {
        userId: '00000000-0000-0000-0000-000000000001',
        actorId: '00000000-0000-0000-0000-000000000002',
        meta: { role: 'admin' },
      }),
    ).resolves.not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// AUDIT_EVENTS constants
// ---------------------------------------------------------------------------

describe('AUDIT_EVENTS', () => {
  it('USER_ROLE_ASSIGNED has expected value', () => {
    expect(AUDIT_EVENTS.USER_ROLE_ASSIGNED).toBe('user.role_assigned')
  })

  it('USER_ROLE_CHANGED has expected value', () => {
    expect(AUDIT_EVENTS.USER_ROLE_CHANGED).toBe('user.role_changed')
  })

  it('USER_ROLE_REVOKED has expected value', () => {
    expect(AUDIT_EVENTS.USER_ROLE_REVOKED).toBe('user.role_revoked')
  })

  it('ADMIN_ACTION has expected value', () => {
    expect(AUDIT_EVENTS.ADMIN_ACTION).toBe('admin.action')
  })

  it('USER_LOGIN has expected value', () => {
    expect(AUDIT_EVENTS.USER_LOGIN).toBe('user.login')
  })

  it('USER_LOGIN_FAILED has expected value', () => {
    expect(AUDIT_EVENTS.USER_LOGIN_FAILED).toBe('user.login_failed')
  })

  it('USER_LOGOUT has expected value', () => {
    expect(AUDIT_EVENTS.USER_LOGOUT).toBe('user.logout')
  })
})
