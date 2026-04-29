import { describe, it, expect, vi, afterEach } from 'vitest'
import sitemap from './sitemap'

describe('/sitemap.xml — generated metadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('contains exactly one entry (the homepage) in the baseline', () => {
    const entries = sitemap()
    expect(entries).toHaveLength(1)
  })

  it('uses the configured site URL for the homepage entry', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://acme.example.com')
    const entries = sitemap()
    expect(entries[0]?.url).toBe('https://acme.example.com')
  })

  it('uses the localhost fallback when NEXT_PUBLIC_APP_URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    const entries = sitemap()
    expect(entries[0]?.url).toBe('http://localhost:7777')
  })

  it('sets a lastModified timestamp', () => {
    const entries = sitemap()
    expect(entries[0]?.lastModified).toBeInstanceOf(Date)
  })

  it('sets a sensible changeFrequency and priority', () => {
    const entries = sitemap()
    expect(entries[0]?.changeFrequency).toBe('weekly')
    expect(entries[0]?.priority).toBe(1)
  })
})
