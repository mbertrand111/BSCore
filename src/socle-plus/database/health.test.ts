import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the lazy db proxy so health checks do not require a live DATABASE_URL.
vi.mock('./db-client', () => ({
  db: {
    execute: vi.fn(),
  },
}))

// Mock the logger so we can assert on server-side diagnostics without
// polluting test output.
vi.mock('@/socle/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

import { checkDatabaseHealth, runSoclePlusChecks } from './health'
import { db } from './db-client'
import { logger } from '@/socle/logger'

describe('checkDatabaseHealth — success', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns ok when SELECT 1 succeeds', async () => {
    vi.mocked(db.execute).mockResolvedValue(undefined as never)
    const result = await checkDatabaseHealth()
    expect(result).toEqual({ name: 'database', status: 'ok' })
  })

  it('does not log when the check succeeds', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.mocked(db.execute).mockResolvedValue(undefined as never)
    await checkDatabaseHealth()
    expect(vi.mocked(logger.warn)).not.toHaveBeenCalled()
  })
})

describe('checkDatabaseHealth — non-production environments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the detailed error message in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.mocked(db.execute).mockRejectedValue(new Error('connection refused'))
    const result = await checkDatabaseHealth()
    expect(result.status).toBe('degraded')
    expect(result.message).toBe('connection refused')
  })

  it('returns the detailed error message in test', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.mocked(db.execute).mockRejectedValue(new Error('boom'))
    const result = await checkDatabaseHealth()
    expect(result.message).toBe('boom')
  })

  it('returns the fallback "Unknown database error" when a non-Error is thrown', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.mocked(db.execute).mockRejectedValue('string failure' as never)
    const result = await checkDatabaseHealth()
    expect(result.status).toBe('degraded')
    expect(result.message).toBe('Unknown database error')
  })
})

describe('checkDatabaseHealth — production environment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NODE_ENV', 'production')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the generic message regardless of the underlying Error message', async () => {
    vi.mocked(db.execute).mockRejectedValue(
      new Error('password authentication failed for user "postgres"'),
    )
    const result = await checkDatabaseHealth()
    expect(result.status).toBe('degraded')
    expect(result.message).toBe('Database health check failed')
  })

  it('returns the generic message when a non-Error is thrown', async () => {
    vi.mocked(db.execute).mockRejectedValue('low-level' as never)
    const result = await checkDatabaseHealth()
    expect(result.message).toBe('Database health check failed')
  })

  it('does not leak the driver error string into the response', async () => {
    const sensitive = 'connect ECONNREFUSED 10.0.0.42:5432 (host: db-internal.acme)'
    vi.mocked(db.execute).mockRejectedValue(new Error(sensitive))
    const result = await checkDatabaseHealth()
    expect(result.message).not.toContain('ECONNREFUSED')
    expect(result.message).not.toContain('10.0.0.42')
    expect(result.message).not.toContain('db-internal.acme')
  })
})

describe('checkDatabaseHealth — server-side logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('logs the detailed error in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.mocked(db.execute).mockRejectedValue(new Error('hidden detail'))
    await checkDatabaseHealth()
    expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(1)
    const call = vi.mocked(logger.warn).mock.calls[0]
    expect(call?.[1]).toEqual({ error: 'hidden detail' })
  })

  it('logs the detailed error in production even though the response is generic', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const sensitive = 'password authentication failed for user "postgres"'
    vi.mocked(db.execute).mockRejectedValue(new Error(sensitive))
    await checkDatabaseHealth()
    expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(1)
    const call = vi.mocked(logger.warn).mock.calls[0]
    expect(call?.[1]).toEqual({ error: sensitive })
  })

  it('logs the fallback string when a non-Error is thrown', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.mocked(db.execute).mockRejectedValue(42 as never)
    await checkDatabaseHealth()
    const call = vi.mocked(logger.warn).mock.calls[0]
    expect(call?.[1]).toEqual({ error: 'Unknown database error' })
  })
})

describe('runSoclePlusChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the database check in an array', async () => {
    vi.mocked(db.execute).mockResolvedValue(undefined as never)
    const checks = await runSoclePlusChecks()
    expect(checks).toHaveLength(1)
    expect(checks[0]?.name).toBe('database')
  })

  it('propagates degraded status from underlying checks', async () => {
    vi.mocked(db.execute).mockRejectedValue(new Error('boom'))
    const checks = await runSoclePlusChecks()
    expect(checks[0]?.status).toBe('degraded')
  })

  it('returns ok status when all underlying checks pass', async () => {
    vi.mocked(db.execute).mockResolvedValue(undefined as never)
    const checks = await runSoclePlusChecks()
    expect(checks.every((c) => c.status === 'ok')).toBe(true)
  })
})
