import { describe, it, expect } from 'vitest'
import { cmsPageInputSchema } from './schemas'

const valid = {
  title: 'About us',
  slug: 'about',
  excerpt: 'A short description.',
  content: 'Hello world.',
  status: 'draft',
  mainMediaAssetId: '',
}

describe('cmsPageInputSchema — happy path', () => {
  it('accepts a minimal valid input', () => {
    const result = cmsPageInputSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('lowercases slug on output', () => {
    const result = cmsPageInputSchema.safeParse({ ...valid, slug: 'About-Us' })
    if (!result.success) throw new Error('expected success')
    expect(result.data.slug).toBe('about-us')
  })

  it('coerces empty optional fields to null', () => {
    const result = cmsPageInputSchema.safeParse({ ...valid, excerpt: '', mainMediaAssetId: '' })
    if (!result.success) throw new Error('expected success')
    expect(result.data.excerpt).toBeNull()
    expect(result.data.mainMediaAssetId).toBeNull()
  })

  it('accepts a UUID for mainMediaAssetId', () => {
    const result = cmsPageInputSchema.safeParse({
      ...valid,
      mainMediaAssetId: '550e8400-e29b-41d4-a716-446655440000',
    })
    if (!result.success) throw new Error('expected success')
    expect(result.data.mainMediaAssetId).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('accepts both draft and published status', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, status: 'draft' }).success).toBe(true)
    expect(cmsPageInputSchema.safeParse({ ...valid, status: 'published' }).success).toBe(true)
  })
})

describe('cmsPageInputSchema — title', () => {
  it('rejects empty title', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
  })

  it('rejects title over 200 chars', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, title: 'a'.repeat(201) }).success).toBe(false)
  })

  it('accepts title at exactly 200 chars', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, title: 'a'.repeat(200) }).success).toBe(true)
  })
})

describe('cmsPageInputSchema — slug validation', () => {
  it('rejects empty slug', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: '' }).success).toBe(false)
  })

  it('rejects slug with uppercase (after transform actually matches lowercased)', () => {
    // The transform lowercases input, so 'ABOUT' becomes 'about' — should pass.
    const result = cmsPageInputSchema.safeParse({ ...valid, slug: 'ABOUT' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.slug).toBe('about')
  })

  it('rejects slug with spaces', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: 'about us' }).success).toBe(false)
  })

  it('rejects slug starting with a hyphen', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: '-about' }).success).toBe(false)
  })

  it('rejects slug ending with a hyphen', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: 'about-' }).success).toBe(false)
  })

  it('rejects reserved slug: admin', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: 'admin' }).success).toBe(false)
  })

  it('rejects reserved slug: api', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: 'api' }).success).toBe(false)
  })

  it('rejects reserved slug: login', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: 'login' }).success).toBe(false)
  })

  it('rejects reserved slug: media', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: 'media' }).success).toBe(false)
  })

  it('rejects reserved slug ignoring case', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, slug: 'ADMIN' }).success).toBe(false)
  })
})

describe('cmsPageInputSchema — excerpt', () => {
  it('rejects excerpt over 500 chars', () => {
    expect(
      cmsPageInputSchema.safeParse({ ...valid, excerpt: 'a'.repeat(501) }).success,
    ).toBe(false)
  })

  it('accepts excerpt at exactly 500 chars', () => {
    expect(
      cmsPageInputSchema.safeParse({ ...valid, excerpt: 'a'.repeat(500) }).success,
    ).toBe(true)
  })
})

describe('cmsPageInputSchema — content', () => {
  it('rejects empty content', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, content: '' }).success).toBe(false)
  })

  it('rejects content over 50_000 chars', () => {
    expect(
      cmsPageInputSchema.safeParse({ ...valid, content: 'a'.repeat(50_001) }).success,
    ).toBe(false)
  })
})

describe('cmsPageInputSchema — status', () => {
  it('rejects invalid status values', () => {
    expect(cmsPageInputSchema.safeParse({ ...valid, status: 'archived' }).success).toBe(false)
    expect(cmsPageInputSchema.safeParse({ ...valid, status: '' }).success).toBe(false)
  })
})

describe('cmsPageInputSchema — mainMediaAssetId', () => {
  it('rejects a non-UUID string', () => {
    expect(
      cmsPageInputSchema.safeParse({ ...valid, mainMediaAssetId: 'not-a-uuid' }).success,
    ).toBe(false)
  })

  it('rejects a partial UUID', () => {
    expect(
      cmsPageInputSchema.safeParse({ ...valid, mainMediaAssetId: '550e8400-e29b' }).success,
    ).toBe(false)
  })
})
