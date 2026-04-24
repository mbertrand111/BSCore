import { describe, it, expect, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { db } from './db-client'
import {
  ensureMigrationsTable,
  getAppliedMigrationIds,
  recordMigration,
} from './migration-table'
import { applyMigrations } from './migration-runner'
import type { Migration } from './migration-types'

// Requires DATABASE_URL pointing to a live PostgreSQL test database.
// Run with: npm run test:integration

const noop = async (): Promise<void> => {}

async function dropMigrationsTable(): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS _migrations`)
}

// ---------------------------------------------------------------------------
// migration-table — low-level DB operations
// ---------------------------------------------------------------------------

describe('ensureMigrationsTable', () => {
  beforeEach(dropMigrationsTable)

  it('creates the _migrations table', async () => {
    await ensureMigrationsTable(db)
    // SELECT should succeed — table exists
    const rows = await db.execute(sql`SELECT COUNT(*) FROM _migrations`)
    expect(rows).toBeDefined()
  })

  it('is idempotent — calling twice does not throw', async () => {
    await ensureMigrationsTable(db)
    await expect(ensureMigrationsTable(db)).resolves.not.toThrow()
  })
})

describe('getAppliedMigrationIds', () => {
  beforeEach(async () => {
    await dropMigrationsTable()
    await ensureMigrationsTable(db)
  })

  it('returns an empty set when no migrations have been applied', async () => {
    const ids = await getAppliedMigrationIds(db)
    expect(ids.size).toBe(0)
  })

  it('returns ids of applied migrations', async () => {
    await recordMigration(db, 'test_migration_a')
    const ids = await getAppliedMigrationIds(db)
    expect(ids.has('test_migration_a')).toBe(true)
  })

  it('returns all recorded ids', async () => {
    await recordMigration(db, 'test_migration_x')
    await recordMigration(db, 'test_migration_y')
    const ids = await getAppliedMigrationIds(db)
    expect(ids.has('test_migration_x')).toBe(true)
    expect(ids.has('test_migration_y')).toBe(true)
    expect(ids.size).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// applyMigrations — orchestration
// ---------------------------------------------------------------------------

describe('applyMigrations', () => {
  beforeEach(dropMigrationsTable)

  it('applies migrations in ascending filename order', async () => {
    const order: string[] = []
    const migrations: Migration[] = [
      { id: '20260424_0002_second', up: async () => { order.push('second') } },
      { id: '20260424_0001_first', up: async () => { order.push('first') } },
    ]
    await applyMigrations(db, migrations)
    expect(order).toEqual(['first', 'second'])
  })

  it('records each migration after applying', async () => {
    const migrations: Migration[] = [
      { id: '20260424_0001_test_a', up: noop },
      { id: '20260424_0002_test_b', up: noop },
    ]
    await applyMigrations(db, migrations)
    const ids = await getAppliedMigrationIds(db)
    expect(ids.has('20260424_0001_test_a')).toBe(true)
    expect(ids.has('20260424_0002_test_b')).toBe(true)
  })

  it('is idempotent — running twice applies nothing the second time', async () => {
    let callCount = 0
    const migrations: Migration[] = [
      { id: '20260424_0001_idempotent', up: async () => { callCount++ } },
    ]
    await applyMigrations(db, migrations)
    await applyMigrations(db, migrations)
    expect(callCount).toBe(1)
  })

  it('skips migrations that were previously applied', async () => {
    const applied: string[] = []
    const first: Migration = { id: '20260424_0001_existing', up: async () => { applied.push('first') } }
    const second: Migration = { id: '20260424_0002_new', up: async () => { applied.push('second') } }

    await applyMigrations(db, [first])
    applied.length = 0

    await applyMigrations(db, [first, second])
    expect(applied).toEqual(['second'])
  })

  it('does not record a migration that throws', async () => {
    const failing: Migration = {
      id: '20260424_0001_will_fail',
      up: async () => { throw new Error('intentional test failure') },
    }
    await expect(applyMigrations(db, [failing])).rejects.toThrow()
    const ids = await getAppliedMigrationIds(db)
    expect(ids.has('20260424_0001_will_fail')).toBe(false)
  })

  it('stops at the first failing migration', async () => {
    const applied: string[] = []
    const migrations: Migration[] = [
      { id: '20260424_0001_ok', up: async () => { applied.push('ok') } },
      { id: '20260424_0002_fail', up: async () => { throw new Error('fail') } },
      { id: '20260424_0003_unreached', up: async () => { applied.push('unreached') } },
    ]
    await expect(applyMigrations(db, migrations)).rejects.toThrow()
    expect(applied).toEqual(['ok'])
    expect(applied).not.toContain('unreached')
  })

  it('throws on duplicate migration IDs', async () => {
    const migrations: Migration[] = [
      { id: 'dup', up: noop },
      { id: 'dup', up: noop },
    ]
    await expect(applyMigrations(db, migrations)).rejects.toThrow('dup')
  })
})
