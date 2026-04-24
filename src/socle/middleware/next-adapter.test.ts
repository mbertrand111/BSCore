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

class MockNextResponse {
  readonly headers = new MockHeaders()
}

vi.mock('next/server', () => ({
  NextResponse: {
    next: () => new MockNextResponse(),
  },
}))

// Import AFTER the mock is registered.
import { nextResponseWithHeaders } from './next-adapter'

// ---------------------------------------------------------------------------
// nextResponseWithHeaders
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
