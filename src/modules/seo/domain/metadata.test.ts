import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Prevent the `server-only` guard from throwing when the metadata module is
// imported in a Node test runner.
vi.mock('server-only', () => ({}))

// Mock site URL helper to a stable value across tests.
vi.mock('@/socle/config/site', () => ({
  getSiteUrl: () => 'https://example.com',
}))

// Mock the SEO repository so metadata tests don't touch the database.
vi.mock('../data/repository', () => ({
  getSeoEntryByRoute: vi.fn(),
}))

import { getSeoMetadata } from './metadata'
import { getSeoEntryByRoute } from '../data/repository'
import type { SeoEntry } from '../data/repository'

const baseEntry: SeoEntry = {
  id: 'fake-id',
  route: '/about',
  title: 'About — DB',
  description: 'Description from DB.',
  canonicalUrl: null,
  robotsIndex: true,
  robotsFollow: true,
  ogTitle: null,
  ogDescription: null,
  ogImageUrl: null,
  twitterTitle: null,
  twitterDescription: null,
  twitterImageUrl: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('getSeoMetadata — no entry, no fallback', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllEnvs())

  it('returns metadata with canonical defaulting to siteUrl + route', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(null)
    const meta = await getSeoMetadata('/about')
    expect(meta.alternates?.canonical).toBe('https://example.com/about')
  })

  it('omits title and description when no source provides them', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(null)
    const meta = await getSeoMetadata('/about')
    expect(meta.title).toBeUndefined()
    expect(meta.description).toBeUndefined()
  })

  it('always returns robots = index + follow when no entry overrides', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(null)
    const meta = await getSeoMetadata('/about')
    expect(meta.robots).toEqual({ index: true, follow: true })
  })
})

describe('getSeoMetadata — fallback only', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses fallback title and description', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(null)
    const meta = await getSeoMetadata('/about', {
      title: 'Fallback title',
      description: 'Fallback description',
    })
    expect(meta.title).toBe('Fallback title')
    expect(meta.description).toBe('Fallback description')
  })

  it('mirrors fallback into OG and Twitter when entry has no overrides', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(null)
    const meta = await getSeoMetadata('/about', {
      title: 'Fallback title',
      description: 'Fallback description',
    })
    const og = meta.openGraph as { title?: string; description?: string }
    const tw = meta.twitter as { title?: string; description?: string }
    expect(og.title).toBe('Fallback title')
    expect(og.description).toBe('Fallback description')
    expect(tw.title).toBe('Fallback title')
    expect(tw.description).toBe('Fallback description')
  })
})

describe('getSeoMetadata — entry overrides fallback', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses DB entry title and description over fallback', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(baseEntry)
    const meta = await getSeoMetadata('/about', {
      title: 'Fallback title',
      description: 'Fallback description',
    })
    expect(meta.title).toBe('About — DB')
    expect(meta.description).toBe('Description from DB.')
  })

  it('uses entry canonicalUrl when set, instead of computed default', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce({
      ...baseEntry,
      canonicalUrl: 'https://other.example.com/about',
    })
    const meta = await getSeoMetadata('/about')
    expect(meta.alternates?.canonical).toBe('https://other.example.com/about')
  })

  it('uses entry-specific OG and Twitter overrides', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce({
      ...baseEntry,
      ogTitle: 'OG specific',
      ogDescription: 'OG description',
      ogImageUrl: 'https://example.com/og.png',
      twitterTitle: 'Tw specific',
      twitterDescription: 'Tw description',
      twitterImageUrl: 'https://example.com/tw.png',
    })
    const meta = await getSeoMetadata('/about')
    const og = meta.openGraph as { title?: string; description?: string; images?: unknown[] }
    const tw = meta.twitter as { title?: string; description?: string; images?: unknown[] }
    expect(og.title).toBe('OG specific')
    expect(og.description).toBe('OG description')
    expect(og.images).toEqual(['https://example.com/og.png'])
    expect(tw.title).toBe('Tw specific')
    expect(tw.description).toBe('Tw description')
    expect(tw.images).toEqual(['https://example.com/tw.png'])
  })

  it('respects robots overrides from entry', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce({
      ...baseEntry,
      robotsIndex: false,
      robotsFollow: false,
    })
    const meta = await getSeoMetadata('/about')
    expect(meta.robots).toEqual({ index: false, follow: false })
  })
})

describe('getSeoMetadata — route normalization', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries the repository with a normalized route', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(null)
    await getSeoMetadata('/about/?utm=x')
    expect(vi.mocked(getSeoEntryByRoute)).toHaveBeenCalledWith('/about')
  })

  it('builds canonical from the normalized route', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(null)
    const meta = await getSeoMetadata('/about/?utm=x')
    expect(meta.alternates?.canonical).toBe('https://example.com/about')
  })
})

describe('getSeoMetadata — openGraph url', () => {
  beforeEach(() => vi.clearAllMocks())

  it('always sets openGraph.url to siteUrl + normalized route', async () => {
    vi.mocked(getSeoEntryByRoute).mockResolvedValueOnce(null)
    const meta = await getSeoMetadata('/about')
    const og = meta.openGraph as { url?: string }
    expect(og.url).toBe('https://example.com/about')
  })
})
