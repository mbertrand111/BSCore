import { describe, it, expect } from 'vitest'
import { sql } from 'drizzle-orm'
import { db } from './db-client'
import { checkDatabaseHealth } from './health'

// Requires DATABASE_URL pointing to a live PostgreSQL test database.
// Run with: npm run test:integration

describe('database — connectivity', () => {
  it('db can execute a raw query', async () => {
    const rows = await db.execute(sql`SELECT 1 AS alive`)
    expect(rows).toBeDefined()
    expect(rows.length).toBeGreaterThanOrEqual(1)
  })

  it('checkDatabaseHealth returns ok when the database is reachable', async () => {
    const result = await checkDatabaseHealth()
    expect(result.name).toBe('database')
    expect(result.status).toBe('ok')
  })

  it('checkDatabaseHealth result has no message when ok', async () => {
    const result = await checkDatabaseHealth()
    expect(result).not.toHaveProperty('message')
  })
})
