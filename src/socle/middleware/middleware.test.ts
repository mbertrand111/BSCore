import { describe, it, expect } from 'vitest'
import type { Logger } from '@/socle/logger'
import { NotFoundError } from '@/socle/errors'
import type { MiddlewareFunction, RequestContext } from './middleware.types'
import { createPipeline } from './pipeline'
import { createRequestContext } from './request-context'
import { generateRequestId } from './request-id'
import { createRequestLoggerMiddleware } from './request-logger'

// Silent logger for tests — prevents console noise, still captures calls.
function makeSilentLogger(): Logger {
  return { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }
}

const testLog = makeSilentLogger()

// ---------------------------------------------------------------------------
// generateRequestId
// ---------------------------------------------------------------------------

describe('generateRequestId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateRequestId()).toBe('string')
    expect(generateRequestId().length).toBeGreaterThan(0)
  })

  it('generates unique IDs on successive calls', () => {
    const ids = Array.from({ length: 20 }, () => generateRequestId())
    const unique = new Set(ids)
    expect(unique.size).toBe(20)
  })

  it('matches UUID v4 format', () => {
    const id = generateRequestId()
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })
})

// ---------------------------------------------------------------------------
// createRequestContext
// ---------------------------------------------------------------------------

describe('createRequestContext', () => {
  it('sets path and method from options', () => {
    const ctx = createRequestContext({ path: '/users', method: 'get' })
    expect(ctx.path).toBe('/users')
    expect(ctx.method).toBe('GET')
  })

  it('uppercases the HTTP method', () => {
    expect(createRequestContext({ path: '/', method: 'post' }).method).toBe('POST')
    expect(createRequestContext({ path: '/', method: 'DELETE' }).method).toBe('DELETE')
  })

  it('generates a request ID when none is provided', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    expect(typeof ctx.requestId).toBe('string')
    expect(ctx.requestId.length).toBeGreaterThan(0)
  })

  it('uses the provided request ID when given', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET', requestId: 'req_test_123' })
    expect(ctx.requestId).toBe('req_test_123')
  })

  it('sets timestamp to approximately the current time', () => {
    const before = new Date()
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const after = new Date()
    expect(ctx.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(ctx.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('initialises meta to an empty object when not provided', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    expect(ctx.meta).toEqual({})
  })

  it('copies provided meta entries into context', () => {
    const ctx = createRequestContext({ path: '/', method: 'GET', meta: { traceId: 'abc' } })
    expect(ctx.meta['traceId']).toBe('abc')
  })

  it('shallow-copies meta so mutations do not affect the caller', () => {
    const originalMeta: Record<string, unknown> = { key: 'original' }
    const ctx = createRequestContext({ path: '/', method: 'GET', meta: originalMeta })
    ctx.meta['key'] = 'mutated'
    expect(originalMeta['key']).toBe('original')
  })
})

// ---------------------------------------------------------------------------
// createPipeline — execution order
// ---------------------------------------------------------------------------

describe('createPipeline — execution order', () => {
  it('runs middleware in the provided order (onion model)', async () => {
    const order: number[] = []
    const first: MiddlewareFunction = async (ctx, next) => {
      order.push(1)
      await next()
      order.push(4)
    }
    const second: MiddlewareFunction = async (ctx, next) => {
      order.push(2)
      await next()
      order.push(3)
    }
    const pipeline = createPipeline([first, second], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    await pipeline(ctx)
    expect(order).toEqual([1, 2, 3, 4])
  })

  it('handles an empty middleware list and returns ok', async () => {
    const pipeline = createPipeline([], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const result = await pipeline(ctx)
    expect(result.ok).toBe(true)
  })

  it('stops at a middleware that does not call next()', async () => {
    const calls: string[] = []
    const stopper: MiddlewareFunction = async () => { calls.push('stopper') }
    const unreachable: MiddlewareFunction = async (ctx, next) => {
      calls.push('unreachable')
      await next()
    }
    const pipeline = createPipeline([stopper, unreachable], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const result = await pipeline(ctx)
    expect(result.ok).toBe(true)
    expect(calls).toEqual(['stopper'])
  })
})

// ---------------------------------------------------------------------------
// createPipeline — context and meta passing
// ---------------------------------------------------------------------------

describe('createPipeline — context passing', () => {
  it('passes the same context reference to every middleware', async () => {
    const captured: RequestContext[] = []
    const a: MiddlewareFunction = async (ctx, next) => { captured.push(ctx); await next() }
    const b: MiddlewareFunction = async (ctx, next) => { captured.push(ctx); await next() }
    const pipeline = createPipeline([a, b], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    await pipeline(ctx)
    expect(captured).toHaveLength(2)
    expect(captured.at(0)).toBe(captured.at(1))
  })

  it('returns the context in the success result', async () => {
    const pipeline = createPipeline([], testLog)
    const ctx = createRequestContext({ path: '/health', method: 'GET' })
    const result = await pipeline(ctx)
    expect(result.context).toBe(ctx)
  })

  it('allows middleware to write meta entries readable by later middleware', async () => {
    let readValue: unknown = 'not set'
    const writer: MiddlewareFunction = async (ctx, next) => {
      ctx.meta['flag'] = 'hello'
      await next()
    }
    const reader: MiddlewareFunction = async (ctx, next) => {
      readValue = ctx.meta['flag']
      await next()
    }
    const pipeline = createPipeline([writer, reader], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    await pipeline(ctx)
    expect(readValue).toBe('hello')
  })

  it('reflects meta mutations in the returned context', async () => {
    const writer: MiddlewareFunction = async (ctx, next) => {
      ctx.meta['written'] = true
      await next()
    }
    const pipeline = createPipeline([writer], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const result = await pipeline(ctx)
    expect(result.context.meta['written']).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createPipeline — error handling
// ---------------------------------------------------------------------------

describe('createPipeline — error handling', () => {
  it('returns ok:false when a middleware throws a standard Error', async () => {
    const throwing: MiddlewareFunction = async () => { throw new Error('boom') }
    const pipeline = createPipeline([throwing], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const result = await pipeline(ctx)
    expect(result.ok).toBe(false)
  })

  it('maps a standard Error to INTERNAL_ERROR code', async () => {
    const throwing: MiddlewareFunction = async () => { throw new Error('raw error') }
    const pipeline = createPipeline([throwing], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const result = await pipeline(ctx)
    if (!result.ok) {
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('raw error')
    }
  })

  it('preserves the original AppError code', async () => {
    const throwing: MiddlewareFunction = async () => {
      throw new NotFoundError('item missing')
    }
    const pipeline = createPipeline([throwing], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const result = await pipeline(ctx)
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })

  it('always includes context in the error result', async () => {
    const throwing: MiddlewareFunction = async () => { throw new Error('x') }
    const pipeline = createPipeline([throwing], testLog)
    const ctx = createRequestContext({ path: '/error-path', method: 'GET' })
    const result = await pipeline(ctx)
    expect(result.context.path).toBe('/error-path')
  })

  it('returns ok:false when next() is called twice', async () => {
    const doubleNext: MiddlewareFunction = async (ctx, next) => {
      await next()
      await next()
    }
    const pipeline = createPipeline([doubleNext], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const result = await pipeline(ctx)
    expect(result.ok).toBe(false)
  })

  it('returns ok:false when next() is called twice even with downstream middleware', async () => {
    const doubleNext: MiddlewareFunction = async (ctx, next) => {
      await next()
      await next()
    }
    const downstream: MiddlewareFunction = async (ctx, next) => { await next() }
    const pipeline = createPipeline([doubleNext, downstream], testLog)
    const ctx = createRequestContext({ path: '/', method: 'GET' })
    const result = await pipeline(ctx)
    expect(result.ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createRequestLoggerMiddleware
// ---------------------------------------------------------------------------

describe('createRequestLoggerMiddleware', () => {
  it('calls next()', async () => {
    let nextCalled = false
    const middleware = createRequestLoggerMiddleware(makeSilentLogger())
    const ctx = createRequestContext({ path: '/test', method: 'GET' })
    await middleware(ctx, async () => { nextCalled = true })
    expect(nextCalled).toBe(true)
  })

  it('logs request start and completion via the provided logger', async () => {
    const messages: string[] = []
    const capturingLogger: Logger = {
      debug: () => {},
      info: (msg) => { messages.push(msg) },
      warn: () => {},
      error: () => {},
    }
    const middleware = createRequestLoggerMiddleware(capturingLogger)
    const ctx = createRequestContext({ path: '/api/resource', method: 'POST' })
    await middleware(ctx, async () => {})
    expect(messages).toContain('request started')
    expect(messages).toContain('request completed')
  })
})
