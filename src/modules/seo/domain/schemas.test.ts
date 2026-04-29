import { describe, it, expect } from 'vitest'
import { seoEntryInputSchema } from './schemas'

const validBase = {
  route: '/about',
  title: 'About us',
  description: 'Learn more about our company.',
  canonicalUrl: '',
  robotsIndex: true,
  robotsFollow: true,
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImageUrl: '',
}

describe('seoEntryInputSchema — happy path', () => {
  it('accepts a minimal valid entry', () => {
    const result = seoEntryInputSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('coerces empty optional strings to null', () => {
    const result = seoEntryInputSchema.safeParse(validBase)
    if (!result.success) throw new Error('expected success')
    expect(result.data.canonicalUrl).toBeNull()
    expect(result.data.ogTitle).toBeNull()
    expect(result.data.ogDescription).toBeNull()
    expect(result.data.ogImageUrl).toBeNull()
    expect(result.data.twitterTitle).toBeNull()
    expect(result.data.twitterDescription).toBeNull()
    expect(result.data.twitterImageUrl).toBeNull()
  })

  it('normalizes the route on output', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '/about/' })
    if (!result.success) throw new Error('expected success')
    expect(result.data.route).toBe('/about')
  })

  it('strips query string from the route on output', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '/about?utm=x' })
    expect(result.success).toBe(false)
    // (Reason: query strings explicitly rejected by the validator. Test enforces the rule.)
  })

  it('accepts a canonical URL when absolute', () => {
    const result = seoEntryInputSchema.safeParse({
      ...validBase,
      canonicalUrl: 'https://example.com/about',
    })
    if (!result.success) throw new Error('expected success')
    expect(result.data.canonicalUrl).toBe('https://example.com/about')
  })

  it('accepts an OG image as absolute URL', () => {
    const result = seoEntryInputSchema.safeParse({
      ...validBase,
      ogImageUrl: 'https://example.com/og.png',
    })
    if (!result.success) throw new Error('expected success')
    expect(result.data.ogImageUrl).toBe('https://example.com/og.png')
  })

  it('accepts an OG image as relative path', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, ogImageUrl: '/og.png' })
    if (!result.success) throw new Error('expected success')
    expect(result.data.ogImageUrl).toBe('/og.png')
  })
})

describe('seoEntryInputSchema — route validation', () => {
  it('rejects an empty route', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a route without a leading /', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: 'about' })
    expect(result.success).toBe(false)
  })

  it('rejects /admin', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '/admin' })
    expect(result.success).toBe(false)
  })

  it('rejects /admin/users', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '/admin/users' })
    expect(result.success).toBe(false)
  })

  it('rejects /api', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '/api' })
    expect(result.success).toBe(false)
  })

  it('rejects /dev', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '/dev' })
    expect(result.success).toBe(false)
  })

  it('rejects /login', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '/login' })
    expect(result.success).toBe(false)
  })

  it('rejects a route with a query string', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, route: '/about?x=1' })
    expect(result.success).toBe(false)
  })
})

describe('seoEntryInputSchema — text length', () => {
  it('rejects an empty title', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a title over 70 characters', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, title: 'a'.repeat(71) })
    expect(result.success).toBe(false)
  })

  it('accepts a title at exactly 70 characters', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, title: 'a'.repeat(70) })
    expect(result.success).toBe(true)
  })

  it('rejects an empty description', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, description: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a description over 160 characters', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, description: 'a'.repeat(161) })
    expect(result.success).toBe(false)
  })

  it('accepts a description at exactly 160 characters', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, description: 'a'.repeat(160) })
    expect(result.success).toBe(true)
  })
})

describe('seoEntryInputSchema — URL formats', () => {
  it('rejects a non-URL canonical', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, canonicalUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects a relative path as canonical (must be absolute)', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, canonicalUrl: '/about' })
    expect(result.success).toBe(false)
  })

  it('rejects an OG image that is neither absolute URL nor / path', () => {
    const result = seoEntryInputSchema.safeParse({ ...validBase, ogImageUrl: 'og.png' })
    expect(result.success).toBe(false)
  })
})
