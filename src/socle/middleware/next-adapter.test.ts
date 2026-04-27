import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SECURITY_HEADERS } from './security-headers'
import { createRequestContext } from './request-context'

// ---------------------------------------------------------------------------
// Mock next/server before importing the adapter so no Edge Runtime is needed.
// ---------------------------------------------------------------------------

class MockHeaders {
  private store = new Map<string, string>()
  set(name: string, value: string): void { this.store.set(name.toLowerCase(), value) }
  get(name: string): string | null { return this.store.get(name.toLowerCase()) ?? null }
  has(name: string): boolean { return this.store.has(name.toLowerCase()) }
}

class MockCookies {
  readonly calls: Array<{ name: string; value: string; options: unknown }> = []
  set(name: string, value: string, options?: unknown): void {
    this.calls.push({ name, value, options })
  }
}

class MockNextResponse {
  readonly headers = new MockHeaders()
  readonly cookies = new MockCookies()
}

vi.mock('next/server', () => ({
  NextResponse: {
    next: () => new MockNextResponse(),
  },
}))

// Import AFTER the mock is registered.
import { nextResponseWithHeaders } from './next-adapter'

// ---------------------------------------------------------------------------
// nextResponseWithHeaders — baseline headers
// ---------------------------------------------------------------------------

describe('nextResponseWithHeaders', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns a defined response object', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const response = nextResponseWithHeaders(ctx)
    expect(response).toBeDefined()
  })

  it('applies every SECURITY_HEADERS entry to the response', () => {
    const ctx = createRequestContext({ path: '/api/test', method: 'POST' })
    const response = nextResponseWithHeaders(ctx)
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name)).toBe(value)
    }
  })

  it('sets x-request-id to ctx.requestId', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET', requestId: 'req_abc_123' })
    const response = nextResponseWithHeaders(ctx)
    expect(response.headers.get('x-request-id')).toBe('req_abc_123')
  })

  it('uses the generated requestId when none is explicitly provided', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const response = nextResponseWithHeaders(ctx)
    expect(response.headers.get('x-request-id')).toBe(ctx.requestId)
    expect(response.headers.get('x-request-id')?.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// nextResponseWithHeaders — pending cookies and headers (session refresh)
// ---------------------------------------------------------------------------

describe('nextResponseWithHeaders — session refresh propagation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('calls response.cookies.set for each pending cookie in ctx.meta', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    ctx.meta['socle.response.cookies'] = [
      { name: 'sb-access-token', value: 'tok_abc', options: { httpOnly: true, secure: true } },
      { name: 'sb-refresh-token', value: 'tok_refresh', options: { httpOnly: true } },
    ]
    const response = nextResponseWithHeaders(ctx)
    const mock = response.cookies as unknown as MockCookies
    expect(mock.calls).toHaveLength(2)
    expect(mock.calls[0]).toEqual({ name: 'sb-access-token', value: 'tok_abc', options: { httpOnly: true, secure: true } })
    expect(mock.calls[1]).toEqual({ name: 'sb-refresh-token', value: 'tok_refresh', options: { httpOnly: true } })
  })

  it('applies pending response headers to the response', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    ctx.meta['socle.response.headers'] = { 'cache-control': 'no-store, max-age=0' }
    const response = nextResponseWithHeaders(ctx)
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0')
  })

  it('skips entries in pending cookies that are not valid cookie objects', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    ctx.meta['socle.response.cookies'] = [null, 42, { name: 'valid', value: 'yes', options: {} }]
    const response = nextResponseWithHeaders(ctx)
    const mock = response.cookies as unknown as MockCookies
    expect(mock.calls).toHaveLength(1)
    expect(mock.calls[0]?.name).toBe('valid')
  })

  it('does not call response.cookies.set when no pending cookies are present', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const response = nextResponseWithHeaders(ctx)
    const mock = response.cookies as unknown as MockCookies
    expect(mock.calls).toHaveLength(0)
  })

  it('does not apply pending headers that have non-string values', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    ctx.meta['socle.response.headers'] = { 'x-valid': 'ok', 'x-invalid': 42 } as Record<string, unknown>
    const response = nextResponseWithHeaders(ctx)
    expect(response.headers.get('x-valid')).toBe('ok')
    expect(response.headers.get('x-invalid')).toBeNull()
  })
})
