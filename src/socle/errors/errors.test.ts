import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
  ERROR_CODES,
  toAppError,
  toSafeError,
} from './index'

afterEach(() => {
  vi.unstubAllEnvs()
})

// ---------------------------------------------------------------------------
// ERROR_CODES
// ---------------------------------------------------------------------------

describe('ERROR_CODES', () => {
  it('exposes stable machine-readable string codes', () => {
    expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND')
    expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED')
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
    expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
  })
})

// ---------------------------------------------------------------------------
// AppError — base class
// ---------------------------------------------------------------------------

describe('AppError', () => {
  it('sets message, code, and meta from constructor arguments', () => {
    const error = new AppError('something failed', 'MY_CODE', { detail: 'x' })
    expect(error.message).toBe('something failed')
    expect(error.code).toBe('MY_CODE')
    expect(error.meta).toEqual({ detail: 'x' })
  })

  it('allows meta to be omitted', () => {
    const error = new AppError('msg', 'CODE')
    expect(error.meta).toBeUndefined()
  })

  it('is an instance of Error and AppError', () => {
    const error = new AppError('msg', 'CODE')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
  })

  it('sets name to "AppError"', () => {
    const error = new AppError('msg', 'CODE')
    expect(error.name).toBe('AppError')
  })

  it('preserves a stack trace', () => {
    const error = new AppError('msg', 'CODE')
    expect(error.stack).toBeDefined()
    expect(typeof error.stack).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// ValidationError
// ---------------------------------------------------------------------------

describe('ValidationError', () => {
  it('uses VALIDATION_ERROR code', () => {
    expect(new ValidationError('bad').code).toBe(ERROR_CODES.VALIDATION_ERROR)
  })

  it('is instanceof ValidationError, AppError, and Error', () => {
    const error = new ValidationError('bad input')
    expect(error).toBeInstanceOf(ValidationError)
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })

  it('sets name to "ValidationError"', () => {
    expect(new ValidationError('x').name).toBe('ValidationError')
  })

  it('accepts optional meta', () => {
    const error = new ValidationError('bad', { field: 'email' })
    expect(error.meta).toEqual({ field: 'email' })
  })
})

// ---------------------------------------------------------------------------
// NotFoundError
// ---------------------------------------------------------------------------

describe('NotFoundError', () => {
  it('uses NOT_FOUND code', () => {
    expect(new NotFoundError('missing').code).toBe(ERROR_CODES.NOT_FOUND)
  })

  it('is instanceof NotFoundError, AppError, and Error', () => {
    const error = new NotFoundError('page missing')
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })

  it('sets name to "NotFoundError"', () => {
    expect(new NotFoundError('x').name).toBe('NotFoundError')
  })
})

// ---------------------------------------------------------------------------
// UnauthorizedError
// ---------------------------------------------------------------------------

describe('UnauthorizedError', () => {
  it('uses UNAUTHORIZED code', () => {
    expect(new UnauthorizedError('not authenticated').code).toBe(ERROR_CODES.UNAUTHORIZED)
  })

  it('is instanceof UnauthorizedError, AppError, and Error', () => {
    const error = new UnauthorizedError('login required')
    expect(error).toBeInstanceOf(UnauthorizedError)
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })

  it('sets name to "UnauthorizedError"', () => {
    expect(new UnauthorizedError('x').name).toBe('UnauthorizedError')
  })
})

// ---------------------------------------------------------------------------
// ForbiddenError
// ---------------------------------------------------------------------------

describe('ForbiddenError', () => {
  it('uses FORBIDDEN code', () => {
    expect(new ForbiddenError('access denied').code).toBe(ERROR_CODES.FORBIDDEN)
  })

  it('is instanceof ForbiddenError, AppError, and Error', () => {
    const error = new ForbiddenError('no access')
    expect(error).toBeInstanceOf(ForbiddenError)
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })

  it('sets name to "ForbiddenError"', () => {
    expect(new ForbiddenError('x').name).toBe('ForbiddenError')
  })
})

// ---------------------------------------------------------------------------
// InternalError
// ---------------------------------------------------------------------------

describe('InternalError', () => {
  it('uses INTERNAL_ERROR code', () => {
    expect(new InternalError('oops').code).toBe(ERROR_CODES.INTERNAL_ERROR)
  })

  it('uses a default message when none is provided', () => {
    expect(new InternalError().message).toBe('An unexpected error occurred')
  })

  it('is instanceof InternalError, AppError, and Error', () => {
    const error = new InternalError('boom')
    expect(error).toBeInstanceOf(InternalError)
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })

  it('sets name to "InternalError"', () => {
    expect(new InternalError('x').name).toBe('InternalError')
  })
})

// ---------------------------------------------------------------------------
// toAppError
// ---------------------------------------------------------------------------

describe('toAppError', () => {
  it('returns an AppError instance unchanged', () => {
    const original = new ValidationError('test', { field: 'name' })
    const result = toAppError(original)
    expect(result).toBe(original)
  })

  it('preserves all AppError subclass types', () => {
    const forbidden = new ForbiddenError('no')
    expect(toAppError(forbidden)).toBe(forbidden)
  })

  it('wraps a standard Error, preserving the message', () => {
    const original = new Error('something exploded')
    const result = toAppError(original)
    expect(result).toBeInstanceOf(InternalError)
    expect(result.message).toBe('something exploded')
  })

  it('captures the original error name in meta when wrapping a standard Error', () => {
    const original = new TypeError('type mismatch')
    const result = toAppError(original)
    expect(result.meta?.['originalName']).toBe('TypeError')
  })

  it('wraps a thrown string', () => {
    const result = toAppError('something went wrong')
    expect(result).toBeInstanceOf(InternalError)
    expect(result.message).toBe('something went wrong')
  })

  it('wraps null with a generic internal error message', () => {
    const result = toAppError(null)
    expect(result).toBeInstanceOf(InternalError)
    expect(result.message).toBe('An unexpected error occurred')
  })

  it('wraps undefined with a generic internal error message', () => {
    const result = toAppError(undefined)
    expect(result).toBeInstanceOf(InternalError)
    expect(result.message).toBe('An unexpected error occurred')
  })

  it('wraps an arbitrary object with a generic internal error message', () => {
    const result = toAppError({ status: 500 })
    expect(result).toBeInstanceOf(InternalError)
    expect(result.message).toBe('An unexpected error occurred')
  })
})

// ---------------------------------------------------------------------------
// toSafeError
// ---------------------------------------------------------------------------

describe('toSafeError', () => {
  it('always includes code and message', () => {
    const error = new NotFoundError('user not found')
    const safe = toSafeError(error)
    expect(safe.code).toBe(ERROR_CODES.NOT_FOUND)
    expect(safe.message).toBe('user not found')
  })

  it('excludes meta in non-development environments', () => {
    // NODE_ENV is 'test' in vitest runs
    const error = new ValidationError('invalid', { field: 'email', debug: 'internal detail' })
    const safe = toSafeError(error)
    expect(safe.meta).toBeUndefined()
  })

  it('includes meta in development environment', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const error = new ValidationError('invalid', { field: 'email' })
    const safe = toSafeError(error)
    expect(safe.meta).toEqual({ field: 'email' })
  })

  it('omits meta field even in development when the error carries no meta', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const error = new NotFoundError('nothing here')
    const safe = toSafeError(error)
    expect(safe.meta).toBeUndefined()
  })

  it('never includes a stack trace in its output', () => {
    const error = new InternalError('crash')
    const safe = toSafeError(error)
    expect(Object.keys(safe)).not.toContain('stack')
  })

  it('does not include stack trace even in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const error = new InternalError('crash')
    const safe = toSafeError(error)
    expect(Object.keys(safe)).not.toContain('stack')
  })
})
