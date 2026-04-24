import { describe, it, expect } from 'vitest'
import { sortMigrationsByFilename, validateUniqueMigrationIds } from './migration-runner'
import type { Migration } from './migration-types'

const noop = async (): Promise<void> => {}

// ---------------------------------------------------------------------------
// sortMigrationsByFilename
// ---------------------------------------------------------------------------

describe('sortMigrationsByFilename', () => {
  it('sorts by id ascending', () => {
    const m1: Migration = { id: '20260424_0002_b', up: noop }
    const m2: Migration = { id: '20260424_0001_a', up: noop }
    const m3: Migration = { id: '20260501_0001_c', up: noop }
    const sorted = sortMigrationsByFilename([m1, m2, m3])
    expect(sorted.map(m => m.id)).toEqual([m2.id, m1.id, m3.id])
  })

  it('returns empty array for empty input', () => {
    expect(sortMigrationsByFilename([])).toHaveLength(0)
  })

  it('does not mutate the input array', () => {
    const m1: Migration = { id: '20260424_0002_b', up: noop }
    const m2: Migration = { id: '20260424_0001_a', up: noop }
    const input = [m1, m2]
    sortMigrationsByFilename(input)
    expect(input[0]?.id).toBe('20260424_0002_b')
  })

  it('is stable for already-sorted input', () => {
    const m1: Migration = { id: '20260424_0001_a', up: noop }
    const m2: Migration = { id: '20260424_0002_b', up: noop }
    const sorted = sortMigrationsByFilename([m1, m2])
    expect(sorted.map(m => m.id)).toEqual([m1.id, m2.id])
  })

  it('orders cross-module migrations by timestamp prefix', () => {
    const soclePlus: Migration = { id: '20260424_0001_create_user_roles', up: noop }
    const module1: Migration = { id: '20260424_0002_create_posts', up: noop }
    const module2: Migration = { id: '20260501_0001_add_slug', up: noop }
    const sorted = sortMigrationsByFilename([module2, module1, soclePlus])
    expect(sorted.map(m => m.id)).toEqual([soclePlus.id, module1.id, module2.id])
  })
})

// ---------------------------------------------------------------------------
// validateUniqueMigrationIds
// ---------------------------------------------------------------------------

describe('validateUniqueMigrationIds', () => {
  it('does not throw for unique ids', () => {
    const migrations: Migration[] = [
      { id: '20260424_0001_a', up: noop },
      { id: '20260424_0002_b', up: noop },
    ]
    expect(() => validateUniqueMigrationIds(migrations)).not.toThrow()
  })

  it('does not throw for empty input', () => {
    expect(() => validateUniqueMigrationIds([])).not.toThrow()
  })

  it('throws when duplicate ids are present', () => {
    const migrations: Migration[] = [
      { id: 'dup_id', up: noop },
      { id: 'dup_id', up: noop },
    ]
    expect(() => validateUniqueMigrationIds(migrations)).toThrow()
  })

  it('error message contains the duplicate id', () => {
    const migrations: Migration[] = [
      { id: 'conflicting_name', up: noop },
      { id: 'other_id', up: noop },
      { id: 'conflicting_name', up: noop },
    ]
    expect(() => validateUniqueMigrationIds(migrations)).toThrow('conflicting_name')
  })
})
