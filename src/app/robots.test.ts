import { describe, it, expect, vi, afterEach } from 'vitest'
import robots from './robots'

describe('/robots.txt — generated metadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns a single rule applying to all user agents', () => {
    const result = robots()
    expect(result.rules).toBeDefined()
    expect(Array.isArray(result.rules)).toBe(false)
    if (Array.isArray(result.rules)) return
    expect(result.rules.userAgent).toBe('*')
  })

  it('allows the public root', () => {
    const result = robots()
    if (Array.isArray(result.rules)) return
    expect(result.rules.allow).toBe('/')
  })

  it('disallows the admin shell', () => {
    const result = robots()
    if (Array.isArray(result.rules)) return
    const disallow = result.rules.disallow
    expect(disallow).toContain('/admin')
    expect(disallow).toContain('/admin/')
  })

  it('disallows the API endpoints', () => {
    const result = robots()
    if (Array.isArray(result.rules)) return
    const disallow = result.rules.disallow
    expect(disallow).toContain('/api')
    expect(disallow).toContain('/api/')
  })

  it('disallows the dev tooling tree', () => {
    const result = robots()
    if (Array.isArray(result.rules)) return
    const disallow = result.rules.disallow
    expect(disallow).toContain('/dev')
    expect(disallow).toContain('/dev/')
  })

  it('disallows /login', () => {
    const result = robots()
    if (Array.isArray(result.rules)) return
    expect(result.rules.disallow).toContain('/login')
  })

  it('points the sitemap at the configured site URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://acme.example.com')
    expect(robots().sitemap).toBe('https://acme.example.com/sitemap.xml')
  })

  it('uses the localhost fallback when NEXT_PUBLIC_APP_URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(robots().sitemap).toBe('http://localhost:7777/sitemap.xml')
  })
})
