import { describe, it, expect } from 'vitest'
import { altTextSchema, fileMetadataSchema, updateAltTextSchema } from './schemas'
import { MAX_SIZE_BYTES } from '../constants'

describe('altTextSchema', () => {
  it('accepts an empty string (alt text is optional content)', () => {
    expect(altTextSchema.safeParse('').success).toBe(true)
  })

  it('trims and accepts a normal description', () => {
    const result = altTextSchema.safeParse('  A photo of a cat  ')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('A photo of a cat')
  })

  it('rejects > 500 characters', () => {
    expect(altTextSchema.safeParse('a'.repeat(501)).success).toBe(false)
  })

  it('accepts exactly 500 characters', () => {
    expect(altTextSchema.safeParse('a'.repeat(500)).success).toBe(true)
  })
})

describe('updateAltTextSchema', () => {
  it('accepts a valid object', () => {
    expect(updateAltTextSchema.safeParse({ altText: 'ok' }).success).toBe(true)
  })

  it('rejects when altText is missing', () => {
    expect(updateAltTextSchema.safeParse({}).success).toBe(false)
  })

  it('rejects when altText is not a string', () => {
    expect(updateAltTextSchema.safeParse({ altText: 123 }).success).toBe(false)
  })
})

describe('fileMetadataSchema — happy path', () => {
  const valid = {
    name: 'photo.jpg',
    type: 'image/jpeg',
    size: 1024,
  }

  it('accepts a valid jpeg', () => {
    expect(fileMetadataSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts png', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, type: 'image/png' }).success).toBe(true)
  })

  it('accepts webp', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, type: 'image/webp' }).success).toBe(true)
  })
})

describe('fileMetadataSchema — name validation', () => {
  const valid = { name: 'photo.jpg', type: 'image/jpeg', size: 1024 }

  it('rejects an empty filename', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects a filename longer than 255 chars', () => {
    expect(
      fileMetadataSchema.safeParse({ ...valid, name: 'a'.repeat(256) + '.jpg' }).success,
    ).toBe(false)
  })
})

describe('fileMetadataSchema — MIME validation', () => {
  const valid = { name: 'photo.jpg', type: 'image/jpeg', size: 1024 }

  it('rejects gif', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, type: 'image/gif' }).success).toBe(false)
  })

  it('rejects svg (V1 excludes it)', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, type: 'image/svg+xml' }).success).toBe(false)
  })

  it('rejects pdf (V1 excludes it)', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, type: 'application/pdf' }).success).toBe(false)
  })

  it('rejects javascript (security)', () => {
    expect(
      fileMetadataSchema.safeParse({ ...valid, type: 'application/javascript' }).success,
    ).toBe(false)
  })

  it('rejects an empty MIME type', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, type: '' }).success).toBe(false)
  })

  it('error message lists allowed types', () => {
    const result = fileMetadataSchema.safeParse({ ...valid, type: 'image/gif' })
    if (result.success) throw new Error('expected failure')
    const message = result.error.issues[0]?.message ?? ''
    expect(message).toContain('image/jpeg')
    expect(message).toContain('image/png')
    expect(message).toContain('image/webp')
  })
})

describe('fileMetadataSchema — size validation', () => {
  const valid = { name: 'photo.jpg', type: 'image/jpeg', size: 1024 }

  it('rejects size 0 (empty file)', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, size: 0 }).success).toBe(false)
  })

  it('rejects negative size', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, size: -1 }).success).toBe(false)
  })

  it('rejects non-integer size', () => {
    expect(fileMetadataSchema.safeParse({ ...valid, size: 1024.5 }).success).toBe(false)
  })

  it(`rejects size > ${MAX_SIZE_BYTES} bytes`, () => {
    expect(fileMetadataSchema.safeParse({ ...valid, size: MAX_SIZE_BYTES + 1 }).success).toBe(false)
  })

  it(`accepts size at exactly ${MAX_SIZE_BYTES} bytes`, () => {
    expect(fileMetadataSchema.safeParse({ ...valid, size: MAX_SIZE_BYTES }).success).toBe(true)
  })
})
