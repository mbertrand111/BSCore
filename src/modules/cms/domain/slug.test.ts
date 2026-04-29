import { describe, it, expect } from 'vitest'
import { isReservedSlug, isValidSlugFormat, normalizeSlug } from './slug'

describe('normalizeSlug', () => {
  it('lowercases input', () => {
    expect(normalizeSlug('AboutUs')).toBe('aboutus')
  })

  it('trims whitespace', () => {
    expect(normalizeSlug('  about  ')).toBe('about')
  })

  it('preserves hyphens', () => {
    expect(normalizeSlug('about-us')).toBe('about-us')
  })

  it('is idempotent', () => {
    expect(normalizeSlug(normalizeSlug('  About-Us  '))).toBe('about-us')
  })
})

describe('isValidSlugFormat', () => {
  it('accepts simple lowercase slugs', () => {
    expect(isValidSlugFormat('about')).toBe(true)
    expect(isValidSlugFormat('about-us')).toBe(true)
    expect(isValidSlugFormat('blog-post-2026')).toBe(true)
    expect(isValidSlugFormat('a')).toBe(true)
    expect(isValidSlugFormat('a1')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidSlugFormat('')).toBe(false)
  })

  it('rejects strings starting with a hyphen', () => {
    expect(isValidSlugFormat('-about')).toBe(false)
  })

  it('rejects strings ending with a hyphen', () => {
    expect(isValidSlugFormat('about-')).toBe(false)
  })

  it('rejects strings with uppercase letters', () => {
    expect(isValidSlugFormat('About')).toBe(false)
    expect(isValidSlugFormat('ABOUT')).toBe(false)
  })

  it('rejects strings with spaces', () => {
    expect(isValidSlugFormat('about us')).toBe(false)
  })

  it('rejects strings with underscores', () => {
    expect(isValidSlugFormat('about_us')).toBe(false)
  })

  it('rejects strings with dots', () => {
    expect(isValidSlugFormat('about.us')).toBe(false)
  })

  it('rejects strings with slashes', () => {
    expect(isValidSlugFormat('about/us')).toBe(false)
  })

  it('rejects strings longer than 100 characters', () => {
    expect(isValidSlugFormat('a'.repeat(101))).toBe(false)
  })

  it('accepts strings of exactly 100 characters', () => {
    expect(isValidSlugFormat('a'.repeat(100))).toBe(true)
  })

  it('rejects unicode / emoji', () => {
    expect(isValidSlugFormat('café')).toBe(false)
    expect(isValidSlugFormat('about💜')).toBe(false)
  })
})

describe('isReservedSlug', () => {
  it('rejects platform routes', () => {
    expect(isReservedSlug('admin')).toBe(true)
    expect(isReservedSlug('api')).toBe(true)
    expect(isReservedSlug('dev')).toBe(true)
    expect(isReservedSlug('login')).toBe(true)
  })

  it('rejects Next.js internal routes', () => {
    expect(isReservedSlug('_next')).toBe(true)
    expect(isReservedSlug('_app')).toBe(true)
    expect(isReservedSlug('_error')).toBe(true)
  })

  it('rejects metadata routes', () => {
    expect(isReservedSlug('robots.txt')).toBe(true)
    expect(isReservedSlug('sitemap.xml')).toBe(true)
    expect(isReservedSlug('favicon.ico')).toBe(true)
  })

  it('rejects other module top-level routes', () => {
    expect(isReservedSlug('media')).toBe(true)
    expect(isReservedSlug('seo')).toBe(true)
    expect(isReservedSlug('blog')).toBe(true)
    expect(isReservedSlug('cms')).toBe(true)
    expect(isReservedSlug('forms')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isReservedSlug('ADMIN')).toBe(true)
    expect(isReservedSlug('Admin')).toBe(true)
  })

  it('does NOT reject similar-looking slugs', () => {
    expect(isReservedSlug('admins')).toBe(false)
    expect(isReservedSlug('blogger')).toBe(false)
    expect(isReservedSlug('cms-help')).toBe(false)
  })

  it('accepts normal page slugs', () => {
    expect(isReservedSlug('about')).toBe(false)
    expect(isReservedSlug('contact')).toBe(false)
    expect(isReservedSlug('pricing')).toBe(false)
  })
})
