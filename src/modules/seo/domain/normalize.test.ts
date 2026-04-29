import { describe, it, expect } from 'vitest'
import { normalizeRoute, isForbiddenSeoRoute } from './normalize'

describe('normalizeRoute', () => {
  it('preserves a clean root path', () => {
    expect(normalizeRoute('/')).toBe('/')
  })

  it('preserves a simple path', () => {
    expect(normalizeRoute('/about')).toBe('/about')
  })

  it('trims whitespace', () => {
    expect(normalizeRoute('  /about  ')).toBe('/about')
  })

  it('strips a query string', () => {
    expect(normalizeRoute('/about?utm=x')).toBe('/about')
  })

  it('strips a hash fragment', () => {
    expect(normalizeRoute('/about#section')).toBe('/about')
  })

  it('strips both query string and hash', () => {
    expect(normalizeRoute('/about?x=1#hash')).toBe('/about')
  })

  it('strips a trailing slash from non-root paths', () => {
    expect(normalizeRoute('/about/')).toBe('/about')
    expect(normalizeRoute('/foo/bar/')).toBe('/foo/bar')
  })

  it('preserves the root path trailing slash', () => {
    expect(normalizeRoute('/')).toBe('/')
  })

  it('preserves case', () => {
    expect(normalizeRoute('/About')).toBe('/About')
  })
})

describe('isForbiddenSeoRoute', () => {
  it('blocks /admin', () => {
    expect(isForbiddenSeoRoute('/admin')).toBe(true)
  })

  it('blocks /admin/users', () => {
    expect(isForbiddenSeoRoute('/admin/users')).toBe(true)
  })

  it('blocks /api', () => {
    expect(isForbiddenSeoRoute('/api')).toBe(true)
  })

  it('blocks /api/health', () => {
    expect(isForbiddenSeoRoute('/api/health')).toBe(true)
  })

  it('blocks /dev', () => {
    expect(isForbiddenSeoRoute('/dev')).toBe(true)
  })

  it('blocks /dev/ui-preview', () => {
    expect(isForbiddenSeoRoute('/dev/ui-preview')).toBe(true)
  })

  it('blocks /login', () => {
    expect(isForbiddenSeoRoute('/login')).toBe(true)
  })

  it('does NOT block /administrator (similar prefix, different segment)', () => {
    expect(isForbiddenSeoRoute('/administrator')).toBe(false)
  })

  it('does NOT block /apidocs (similar prefix, different segment)', () => {
    expect(isForbiddenSeoRoute('/apidocs')).toBe(false)
  })

  it('does NOT block /developers (similar prefix)', () => {
    expect(isForbiddenSeoRoute('/developers')).toBe(false)
  })

  it('does NOT block /loginpage (similar prefix)', () => {
    expect(isForbiddenSeoRoute('/loginpage')).toBe(false)
  })

  it('does NOT block /about, /blog, /products', () => {
    expect(isForbiddenSeoRoute('/about')).toBe(false)
    expect(isForbiddenSeoRoute('/blog')).toBe(false)
    expect(isForbiddenSeoRoute('/products')).toBe(false)
  })

  it('normalizes before checking — blocks /admin/ even with trailing slash', () => {
    expect(isForbiddenSeoRoute('/admin/')).toBe(true)
  })

  it('normalizes before checking — blocks /admin?x=1', () => {
    expect(isForbiddenSeoRoute('/admin?x=1')).toBe(true)
  })
})
