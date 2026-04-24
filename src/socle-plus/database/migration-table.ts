import { sql } from 'drizzle-orm'
import type { Db } from './db-client'

export async function ensureMigrationsTable(db: Db): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export async function getAppliedMigrationIds(db: Db): Promise<ReadonlySet<string>> {
  const rows = await db.execute(sql`SELECT id FROM _migrations ORDER BY applied_at ASC`)
  const ids = new Set<string>()
  for (const row of rows) {
    const id = row['id']
    if (typeof id !== 'string') {
      throw new Error(
        `Unexpected type for _migrations.id: expected string, got ${typeof id}`,
      )
    }
    ids.add(id)
  }
  return ids
}

export async function recordMigration(db: Db, id: string): Promise<void> {
  await db.execute(sql`INSERT INTO _migrations (id) VALUES (${id})`)
}
