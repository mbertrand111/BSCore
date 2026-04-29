import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('getStoragePublicUrl', () => {
  it('returns the public URL when SUPABASE_URL is set', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://abc.supabase.co')
    const { getStoragePublicUrl } = await import('./storage')
    expect(getStoragePublicUrl('2026/04/uuid.jpg')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/media/2026/04/uuid.jpg',
    )
  })

  it('returns an empty string when SUPABASE_URL is not set', async () => {
    vi.stubEnv('SUPABASE_URL', '')
    const { getStoragePublicUrl } = await import('./storage')
    expect(getStoragePublicUrl('whatever.jpg')).toBe('')
  })

  it('handles paths with multiple slashes', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://abc.supabase.co')
    const { getStoragePublicUrl } = await import('./storage')
    expect(getStoragePublicUrl('a/b/c.png')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/media/a/b/c.png',
    )
  })
})

describe('getMediaPublicUrl', () => {
  it('returns the URL for an asset by reading its storagePath', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://abc.supabase.co')
    const { getMediaPublicUrl } = await import('./storage')
    expect(getMediaPublicUrl({ storagePath: '2026/04/abc.jpg' })).toBe(
      'https://abc.supabase.co/storage/v1/object/public/media/2026/04/abc.jpg',
    )
  })

  it('matches getStoragePublicUrl for the same path — single source of truth', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://abc.supabase.co')
    const { getMediaPublicUrl, getStoragePublicUrl } = await import('./storage')
    const path = '2026/04/uuid.png'
    expect(getMediaPublicUrl({ storagePath: path })).toBe(getStoragePublicUrl(path))
  })

  it('accepts any object exposing storagePath, not just full MediaAsset', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://abc.supabase.co')
    const { getMediaPublicUrl } = await import('./storage')
    const minimal = { storagePath: 'x.jpg' } as const
    expect(getMediaPublicUrl(minimal)).toBe(
      'https://abc.supabase.co/storage/v1/object/public/media/x.jpg',
    )
  })

  it('returns empty string when SUPABASE_URL is unset', async () => {
    vi.stubEnv('SUPABASE_URL', '')
    const { getMediaPublicUrl } = await import('./storage')
    expect(getMediaPublicUrl({ storagePath: 'x.jpg' })).toBe('')
  })
})
