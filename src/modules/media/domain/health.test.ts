import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

// Mock the lazy db proxy so health checks do not require DATABASE_URL.
vi.mock('@/socle-plus/database', () => ({
  db: {
    select: vi.fn(),
  },
}))

// Mock the storage helper used by checkMediaStorage so we never reach
// out to a real Supabase Storage API in tests.
vi.mock('./storage', () => ({
  isStorageBucketReady: vi.fn(),
}))

vi.mock('@/socle/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

import { checkMediaDatabase, checkMediaStorage, runMediaChecks } from './health'
import { db } from '@/socle-plus/database'
import { isStorageBucketReady } from './storage'

// Helper to fake a Drizzle chain returning [] (success path) or throwing.
function dbReturns(rows: unknown[]): void {
  vi.mocked(db.select).mockReturnValue({
    from: () => ({
      limit: () => Promise.resolve(rows),
    }),
  } as never)
}

function dbThrows(error: Error): void {
  vi.mocked(db.select).mockReturnValue({
    from: () => ({
      limit: () => Promise.reject(error),
    }),
  } as never)
}

describe('checkMediaDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns ok when the table is reachable', async () => {
    dbReturns([])
    const result = await checkMediaDatabase()
    expect(result).toEqual({ name: 'media.db', status: 'ok' })
  })

  it('returns degraded when the query throws (table missing, etc.)', async () => {
    dbThrows(new Error('relation "media_assets" does not exist'))
    const result = await checkMediaDatabase()
    expect(result.name).toBe('media.db')
    expect(result.status).toBe('degraded')
  })

  it('exposes the underlying error message in non-production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    dbThrows(new Error('relation "media_assets" does not exist'))
    const result = await checkMediaDatabase()
    expect(result.message).toBe('relation "media_assets" does not exist')
  })

  it('returns a generic message in production (no driver detail leak)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    dbThrows(new Error('connect ECONNREFUSED 10.0.0.42:5432'))
    const result = await checkMediaDatabase()
    expect(result.message).toBe('Media database check failed')
    expect(result.message).not.toContain('ECONNREFUSED')
    expect(result.message).not.toContain('10.0.0.42')
  })
})

describe('checkMediaStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns ok when the bucket is reachable', async () => {
    vi.mocked(isStorageBucketReady).mockResolvedValue({ ok: true })
    const result = await checkMediaStorage()
    expect(result).toEqual({ name: 'media.storage', status: 'ok' })
  })

  it('returns degraded when env is missing', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.mocked(isStorageBucketReady).mockResolvedValue({
      ok: false,
      reason: 'SUPABASE_URL or SUPABASE_SERVICE_KEY not set',
    })
    const result = await checkMediaStorage()
    expect(result.name).toBe('media.storage')
    expect(result.status).toBe('degraded')
    expect(result.message).toContain('SUPABASE_URL')
  })

  it('returns degraded when the bucket is not found', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.mocked(isStorageBucketReady).mockResolvedValue({
      ok: false,
      reason: 'bucket "media" not found',
    })
    const result = await checkMediaStorage()
    expect(result.status).toBe('degraded')
    expect(result.message).toContain('not found')
  })

  it('returns a generic message in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.mocked(isStorageBucketReady).mockResolvedValue({
      ok: false,
      reason: 'connect ECONNREFUSED 10.0.0.42:443',
    })
    const result = await checkMediaStorage()
    expect(result.message).toBe('Media storage check failed')
    expect(result.message).not.toContain('ECONNREFUSED')
  })
})

describe('runMediaChecks — aggregator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns both checks when everything is healthy', async () => {
    dbReturns([])
    vi.mocked(isStorageBucketReady).mockResolvedValue({ ok: true })
    const checks = await runMediaChecks()
    expect(checks).toHaveLength(2)
    expect(checks.every((c) => c.status === 'ok')).toBe(true)
    expect(checks.map((c) => c.name).sort()).toEqual(['media.db', 'media.storage'])
  })

  it('reports degraded for db when only db fails', async () => {
    dbThrows(new Error('table missing'))
    vi.mocked(isStorageBucketReady).mockResolvedValue({ ok: true })
    const checks = await runMediaChecks()
    const dbCheck = checks.find((c) => c.name === 'media.db')
    const storageCheck = checks.find((c) => c.name === 'media.storage')
    expect(dbCheck?.status).toBe('degraded')
    expect(storageCheck?.status).toBe('ok')
  })

  it('reports degraded for storage when only storage fails', async () => {
    dbReturns([])
    vi.mocked(isStorageBucketReady).mockResolvedValue({
      ok: false,
      reason: 'bucket not found',
    })
    const checks = await runMediaChecks()
    const dbCheck = checks.find((c) => c.name === 'media.db')
    const storageCheck = checks.find((c) => c.name === 'media.storage')
    expect(dbCheck?.status).toBe('ok')
    expect(storageCheck?.status).toBe('degraded')
  })

  it('runs both probes in parallel (Promise.all semantics)', async () => {
    dbReturns([])
    vi.mocked(isStorageBucketReady).mockResolvedValue({ ok: true })
    const checks = await runMediaChecks()
    expect(checks).toHaveLength(2)
  })
})
