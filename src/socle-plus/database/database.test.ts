import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// These tests exercise module-level initialization behavior.
// Static imports of db-client.ts are intentionally avoided here — importing the
// module IS the action under test, and it must run fresh each time.

describe('db-client — fail-fast initialization', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when DATABASE_URL is not set', async () => {
    vi.stubEnv('DATABASE_URL', '')
    await expect(import('./db-client')).rejects.toThrow('DATABASE_URL')
  })

  it('error is an instance of Error', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const error: unknown = await import('./db-client').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
  })

  it('error message names DATABASE_URL', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const error: unknown = await import('./db-client').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain('DATABASE_URL')
  })

  it('error message mentions Socle+', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const error: unknown = await import('./db-client').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain('Socle+')
  })

  it('exports db when DATABASE_URL is set', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/test')
    const mod = await import('./db-client')
    expect(mod.db).toBeDefined()
  })
})
