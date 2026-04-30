import { describe, expect, it } from 'vitest'
import {
  blockSchema,
  blocksFromLegacyContent,
  blocksSchema,
  defaultBlock,
  deriveContentFromBlocks,
  type Block,
  type CtaBlock,
  type GalleryBlock,
  type HeroBlock,
  type TextBlock,
} from './blocks'

const id = 'a1b2c3d4-1234-4abc-9def-aabbccddeeff'
const id2 = 'b2c3d4e5-1234-4abc-9def-aabbccddeefa'

describe('blockSchema — hero', () => {
  const base: HeroBlock = { id, type: 'hero', version: 1, title: 'Hello' }

  it('accepts a minimal hero', () => {
    expect(blockSchema.safeParse(base).success).toBe(true)
  })

  it('accepts hero with subtitle and mediaId', () => {
    const result = blockSchema.safeParse({ ...base, subtitle: 'Sub', mediaId: id2 })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = blockSchema.safeParse({ ...base, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects subtitle longer than 280 chars', () => {
    const result = blockSchema.safeParse({ ...base, subtitle: 'a'.repeat(281) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid mediaId UUID', () => {
    const result = blockSchema.safeParse({ ...base, mediaId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('blockSchema — text', () => {
  const base: TextBlock = { id, type: 'text', version: 1, body: 'Some body text.' }

  it('accepts a non-empty body', () => {
    expect(blockSchema.safeParse(base).success).toBe(true)
  })

  it('rejects empty body', () => {
    const result = blockSchema.safeParse({ ...base, body: '' })
    expect(result.success).toBe(false)
  })

  it('rejects body longer than max', () => {
    const result = blockSchema.safeParse({ ...base, body: 'a'.repeat(10_001) })
    expect(result.success).toBe(false)
  })
})

describe('blockSchema — gallery', () => {
  const base: GalleryBlock = {
    id,
    type: 'gallery',
    version: 1,
    mediaIds: [id2],
  }

  it('accepts a single image', () => {
    expect(blockSchema.safeParse(base).success).toBe(true)
  })

  it('rejects an empty mediaIds array', () => {
    const result = blockSchema.safeParse({ ...base, mediaIds: [] })
    expect(result.success).toBe(false)
  })

  it('rejects more than 60 images', () => {
    const ids = Array.from({ length: 61 }, () => id2)
    const result = blockSchema.safeParse({ ...base, mediaIds: ids })
    expect(result.success).toBe(false)
  })

  it('accepts an optional title', () => {
    const result = blockSchema.safeParse({ ...base, title: 'Selection 2025' })
    expect(result.success).toBe(true)
  })
})

describe('blockSchema — cta', () => {
  const base: CtaBlock = {
    id,
    type: 'cta',
    version: 1,
    title: 'Réserver',
    ctaLabel: 'Contact',
    ctaHref: '/contact',
  }

  it('accepts an internal href starting with /', () => {
    expect(blockSchema.safeParse(base).success).toBe(true)
  })

  it('accepts an absolute https href', () => {
    const result = blockSchema.safeParse({ ...base, ctaHref: 'https://example.com' })
    expect(result.success).toBe(true)
  })

  it('accepts an anchor href starting with #', () => {
    const result = blockSchema.safeParse({ ...base, ctaHref: '#contact' })
    expect(result.success).toBe(true)
  })

  it('rejects bare strings without /, #, or http', () => {
    const result = blockSchema.safeParse({ ...base, ctaHref: 'contact' })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = blockSchema.safeParse({ ...base, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty ctaLabel', () => {
    const result = blockSchema.safeParse({ ...base, ctaLabel: '' })
    expect(result.success).toBe(false)
  })
})

describe('blocksSchema — array', () => {
  it('accepts an empty array (default)', () => {
    expect(blocksSchema.safeParse([]).success).toBe(true)
  })

  it('rejects non-array values', () => {
    expect(blocksSchema.safeParse('not array').success).toBe(false)
    expect(blocksSchema.safeParse({ type: 'hero' }).success).toBe(false)
  })

  it('rejects more than 100 blocks', () => {
    const items = Array.from(
      { length: 101 },
      (_, i) =>
        ({
          id: `${id.slice(0, 28)}${(i % 10).toString()}f`,
          type: 'text',
          version: 1,
          body: 'x',
        }) satisfies Block,
    )
    const result = blocksSchema.safeParse(items)
    expect(result.success).toBe(false)
  })

  it('rejects when any single block is invalid', () => {
    const result = blocksSchema.safeParse([
      { id, type: 'text', version: 1, body: 'ok' },
      { id: id2, type: 'text', version: 1, body: '' }, // empty body fails
    ])
    expect(result.success).toBe(false)
  })
})

describe('defaultBlock', () => {
  it('hero defaults to empty title', () => {
    const b = defaultBlock('hero') as HeroBlock
    expect(b.type).toBe('hero')
    expect(b.title).toBe('')
  })

  it('cta defaults to a usable label and internal root href', () => {
    const b = defaultBlock('cta') as CtaBlock
    expect(b.ctaLabel).not.toBe('')
    expect(b.ctaHref.startsWith('/')).toBe(true)
  })

  it('gallery defaults to empty mediaIds', () => {
    const b = defaultBlock('gallery') as GalleryBlock
    expect(b.mediaIds).toEqual([])
  })

  it('text defaults to empty body', () => {
    const b = defaultBlock('text') as TextBlock
    expect(b.body).toBe('')
  })
})

describe('blocksFromLegacyContent', () => {
  it('returns a single text block from non-empty content', () => {
    const blocks = blocksFromLegacyContent('Hello world')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.type).toBe('text')
    expect(blocks[0]?.type === 'text' && blocks[0].body).toBe('Hello world')
  })

  it('returns an empty array for whitespace-only content', () => {
    expect(blocksFromLegacyContent('')).toEqual([])
    expect(blocksFromLegacyContent('   \n  \n  ')).toEqual([])
  })
})

describe('deriveContentFromBlocks', () => {
  it('concatenates Text blocks with double newlines', () => {
    const blocks: Block[] = [
      { id, type: 'text', version: 1, body: 'one' },
      { id: id2, type: 'hero', version: 1, title: 'ignored' }, // not a text block
      { id, type: 'text', version: 1, body: 'two' },
    ]
    expect(deriveContentFromBlocks(blocks)).toBe('one\n\ntwo')
  })

  it('returns empty string when no Text blocks exist', () => {
    const blocks: Block[] = [{ id, type: 'hero', version: 1, title: 'h' }]
    expect(deriveContentFromBlocks(blocks)).toBe('')
  })
})
