import { describe, it, expect, vi, afterEach } from 'vitest'
import { createLogger, sanitizeMeta } from './index'
import { parseLogLevel, shouldLog } from './log-level'

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// parseLogLevel
// ---------------------------------------------------------------------------

describe('parseLogLevel', () => {
  it('returns the parsed level when the input is valid', () => {
    expect(parseLogLevel('debug', 'info')).toBe('debug')
    expect(parseLogLevel('info', 'debug')).toBe('info')
    expect(parseLogLevel('warn', 'info')).toBe('warn')
    expect(parseLogLevel('error', 'info')).toBe('error')
  })

  it('returns the fallback for invalid strings', () => {
    expect(parseLogLevel('verbose', 'warn')).toBe('warn')
    expect(parseLogLevel('WARN', 'info')).toBe('info') // case-sensitive
    expect(parseLogLevel('', 'error')).toBe('error')
  })

  it('returns the fallback for undefined', () => {
    expect(parseLogLevel(undefined, 'info')).toBe('info')
  })
})

// ---------------------------------------------------------------------------
// shouldLog
// ---------------------------------------------------------------------------

describe('shouldLog', () => {
  it('allows messages at or above the active level', () => {
    expect(shouldLog('warn', 'warn')).toBe(true)
    expect(shouldLog('warn', 'error')).toBe(true)
    expect(shouldLog('debug', 'debug')).toBe(true)
    expect(shouldLog('debug', 'info')).toBe(true)
    expect(shouldLog('debug', 'warn')).toBe(true)
    expect(shouldLog('debug', 'error')).toBe(true)
  })

  it('suppresses messages below the active level', () => {
    expect(shouldLog('warn', 'debug')).toBe(false)
    expect(shouldLog('warn', 'info')).toBe(false)
    expect(shouldLog('error', 'debug')).toBe(false)
    expect(shouldLog('error', 'warn')).toBe(false)
    expect(shouldLog('info', 'debug')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createLogger — level filtering
// ---------------------------------------------------------------------------

describe('createLogger — level filtering', () => {
  it('suppresses debug and info when level is warn', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const log = createLogger({ level: 'warn' })

    log.debug('debug message')
    log.info('info message')

    expect(debugSpy).not.toHaveBeenCalled()
    expect(infoSpy).not.toHaveBeenCalled()
  })

  it('passes warn and error through when level is warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = createLogger({ level: 'warn' })

    log.warn('warn message')
    log.error('error message')

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(errorSpy).toHaveBeenCalledOnce()
  })

  it('passes all levels through when level is debug', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const infoSpy  = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy  = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = createLogger({ level: 'debug' })

    log.debug('d')
    log.info('i')
    log.warn('w')
    log.error('e')

    expect(debugSpy).toHaveBeenCalledOnce()
    expect(infoSpy).toHaveBeenCalledOnce()
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(errorSpy).toHaveBeenCalledOnce()
  })

  it('passes only errors through when level is error', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const infoSpy  = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy  = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = createLogger({ level: 'error' })

    log.debug('d')
    log.info('i')
    log.warn('w')
    log.error('e')

    expect(debugSpy).not.toHaveBeenCalled()
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// createLogger — silent mode
// ---------------------------------------------------------------------------

describe('createLogger — silent mode', () => {
  it('produces no output regardless of level', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = createLogger({ level: 'debug', silent: true })

    log.debug('should be silent')
    log.error('should also be silent')

    expect(debugSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// createLogger — output format
// ---------------------------------------------------------------------------

describe('createLogger — output format', () => {
  it('prefixes the message with the level in uppercase brackets', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const log = createLogger({ level: 'debug' })

    log.info('platform ready')

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'))
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('platform ready'))
  })

  it('uses the correct console method for each level', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const infoSpy  = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy  = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = createLogger({ level: 'debug' })

    log.debug('d')
    log.info('i')
    log.warn('w')
    log.error('e')

    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'))
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'))
  })

  it('passes meta as the second argument when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const log = createLogger({ level: 'debug' })
    const meta = { requestId: 'req_abc', statusCode: 500 }

    log.error('request failed', meta)

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      meta,
    )
  })

  it('calls with a single argument when no meta is provided', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const log = createLogger({ level: 'debug' })

    log.debug('no meta here')

    // toHaveBeenCalledWith with one argument asserts exactly one argument was passed
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'))
  })
})

// ---------------------------------------------------------------------------
// sanitizeMeta
// ---------------------------------------------------------------------------

describe('sanitizeMeta', () => {
  it('passes through non-sensitive keys unchanged', () => {
    const result = sanitizeMeta({ requestId: 'r_1', statusCode: 200, route: '/health' })
    expect(result).toEqual({ requestId: 'r_1', statusCode: 200, route: '/health' })
  })

  it('redacts keys matching "password"', () => {
    const result = sanitizeMeta({ password: 'hunter2', username: 'alice' })
    expect(result['password']).toBe('[REDACTED]')
    expect(result['username']).toBe('alice')
  })

  it('redacts keys containing sensitive patterns (case-insensitive)', () => {
    const result = sanitizeMeta({
      PASSWORD: 'exposed',
      accessToken: 'tok_xxx',
      refresh_token: 'ref_xxx',
      API_KEY: 'key_123',
    })
    expect(result['PASSWORD']).toBe('[REDACTED]')
    expect(result['accessToken']).toBe('[REDACTED]')
    expect(result['refresh_token']).toBe('[REDACTED]')
    expect(result['API_KEY']).toBe('[REDACTED]')
  })

  it('preserves original key names while redacting values', () => {
    const result = sanitizeMeta({ token: 'abc' })
    expect(Object.keys(result)).toContain('token')
    expect(result['token']).toBe('[REDACTED]')
  })

  it('does not mutate the original meta object', () => {
    const original = { password: 'secret', name: 'test' }
    sanitizeMeta(original)
    expect(original['password']).toBe('secret')
  })
})
