import { describe, it, expect } from 'vitest'
import { safeReturnTo, RETURN_TO_FALLBACK } from './return-to'

describe('safeReturnTo — accepted values', () => {
  it('accepts a simple relative path', () => {
    expect(safeReturnTo('/admin/users')).toBe('/admin/users')
  })

  it('accepts the admin root', () => {
    expect(safeReturnTo('/admin')).toBe('/admin')
  })

  it('accepts a path with a query string', () => {
    expect(safeReturnTo('/admin?tab=roles')).toBe('/admin?tab=roles')
  })

  it('accepts a path with a hash', () => {
    expect(safeReturnTo('/admin#section')).toBe('/admin#section')
  })

  it('accepts deep paths', () => {
    expect(safeReturnTo('/admin/users/abc-123/edit')).toBe('/admin/users/abc-123/edit')
  })
})

describe('safeReturnTo — rejected values fall back', () => {
  it('rejects undefined', () => {
    expect(safeReturnTo(undefined)).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects null', () => {
    expect(safeReturnTo(null)).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects empty string', () => {
    expect(safeReturnTo('')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects absolute http URLs', () => {
    expect(safeReturnTo('http://evil.com')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects absolute https URLs', () => {
    expect(safeReturnTo('https://evil.com/admin')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects protocol-relative URLs (//host)', () => {
    expect(safeReturnTo('//evil.com')).toBe(RETURN_TO_FALLBACK)
    expect(safeReturnTo('//evil.com/admin')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects backslash-prefixed paths (browser quirk)', () => {
    expect(safeReturnTo('/\\evil.com')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects paths not starting with /', () => {
    expect(safeReturnTo('admin/users')).toBe(RETURN_TO_FALLBACK)
    expect(safeReturnTo('javascript:alert(1)')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects /login itself (loop prevention)', () => {
    expect(safeReturnTo('/login')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects /login with query string', () => {
    expect(safeReturnTo('/login?returnTo=/admin')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects /login with sub-path', () => {
    expect(safeReturnTo('/login/x')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects /login with hash', () => {
    expect(safeReturnTo('/login#x')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects values containing spaces', () => {
    expect(safeReturnTo('/admin /users')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects values containing tabs', () => {
    expect(safeReturnTo('/admin\tusers')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects values containing newlines', () => {
    expect(safeReturnTo('/admin\nusers')).toBe(RETURN_TO_FALLBACK)
  })

  it('rejects values containing control characters', () => {
    expect(safeReturnTo('/admin\x00users')).toBe(RETURN_TO_FALLBACK)
    expect(safeReturnTo('/admin\x7fusers')).toBe(RETURN_TO_FALLBACK)
  })
})

describe('safeReturnTo — fallback constant', () => {
  it('exports the fallback as a stable constant', () => {
    expect(RETURN_TO_FALLBACK).toBe('/admin')
  })
})
