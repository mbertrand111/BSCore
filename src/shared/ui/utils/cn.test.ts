import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('drops falsy values (false, null, undefined)', () => {
    expect(cn('foo', false && 'bar', null, undefined, 'baz')).toBe('foo baz')
  })

  it('handles conditional object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('resolves tailwind conflicts — last value wins', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('resolves nested tailwind conflicts across arguments', () => {
    expect(cn('text-sm font-bold', 'text-lg')).toBe('font-bold text-lg')
  })

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })
})
