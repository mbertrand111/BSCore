import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// These tests exercise the lazy initialization behavior of db-client.ts.
// Static imports of the module are avoided here — importing IS the action
// under test in some cases, and the module must run fresh each time.

describe('db-client — lazy initialization', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not throw at module import when DATABASE_URL is not set', async () => {
    vi.stubEnv('DATABASE_URL', '')
    await expect(import('./db-client')).resolves.toBeDefined()
  })

  it('throws when DATABASE_URL is not set and db is first used', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const { db } = await import('./db-client')
    expect(() => db.select).toThrow('DATABASE_URL')
  })

  it('error is an instance of Error', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const { db } = await import('./db-client')
    expect(() => db.select).toThrow(Error)
  })

  it('error message names DATABASE_URL', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const { db } = await import('./db-client')
    expect(() => db.select).toThrow('DATABASE_URL')
  })

  it('error message mentions Socle+', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const { db } = await import('./db-client')
    expect(() => db.select).toThrow('Socle+')
  })

  it('exports db when DATABASE_URL is set', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/test')
    const mod = await import('./db-client')
    expect(mod.db).toBeDefined()
  })
})
