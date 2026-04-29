import { describe, it, expect, vi, afterEach } from 'vitest'
import { getSiteUrl, getSiteUrlObject } from './site'

describe('getSiteUrl — non-production (dev / test)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the dev fallback when NEXT_PUBLIC_APP_URL is unset', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(getSiteUrl()).toBe('http://localhost:7777')
  })

  it('returns the dev fallback in test environment when env is unset', () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(getSiteUrl()).toBe('http://localhost:7777')
  })

  it('returns the configured origin when NEXT_PUBLIC_APP_URL is valid', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://acme.example.com')
    expect(getSiteUrl()).toBe('https://acme.example.com')
  })

  it('strips trailing slash, path, query and hash', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://acme.example.com/foo?x=1#hash')
    expect(getSiteUrl()).toBe('https://acme.example.com')
  })

  it('preserves a non-default port', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://acme.example.com:8443')
    expect(getSiteUrl()).toBe('https://acme.example.com:8443')
  })

  it('falls back to dev when value is malformed (dev)', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'not-a-url')
    expect(getSiteUrl()).toBe('http://localhost:7777')
  })

  it('falls back to dev when value is just whitespace (dev)', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '   ')
    expect(getSiteUrl()).toBe('http://localhost:7777')
  })
})

describe('getSiteUrl — production strictness', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when NEXT_PUBLIC_APP_URL is missing in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(() => getSiteUrl()).toThrowError(/NEXT_PUBLIC_APP_URL is required in production/)
  })

  it('throws when NEXT_PUBLIC_APP_URL is malformed in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'not-a-url')
    expect(() => getSiteUrl()).toThrowError(/has an invalid value/)
  })

  it('error message includes the offending value when invalid', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'not-a-url')
    expect(() => getSiteUrl()).toThrowError(/"not-a-url"/)
  })

  it('does not throw when NEXT_PUBLIC_APP_URL is valid in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://acme.example.com')
    expect(getSiteUrl()).toBe('https://acme.example.com')
  })

  it('still strips path/query/hash in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://acme.example.com/path?x=1#h')
    expect(getSiteUrl()).toBe('https://acme.example.com')
  })
})

describe('getSiteUrlObject', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns a URL object built from getSiteUrl()', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://acme.example.com')
    const url = getSiteUrlObject()
    expect(url).toBeInstanceOf(URL)
    expect(url.origin).toBe('https://acme.example.com')
  })

  it('falls back to localhost URL object when env is unset (dev)', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(getSiteUrlObject().origin).toBe('http://localhost:7777')
  })

  it('throws in production when env is missing', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    expect(() => getSiteUrlObject()).toThrow()
  })
})
