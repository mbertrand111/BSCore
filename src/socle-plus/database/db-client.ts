import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { getEnv } from '@/socle/config/env'

function createDb(): PostgresJsDatabase {
  const url = getEnv('DATABASE_URL')
  if (!url) {
    throw new Error(
      'DATABASE_URL is required for Socle+ but is not set. ' +
        'Set DATABASE_URL in .env or remove Socle+ imports for a Socle-only project.',
    )
  }
  const client = postgres(url)
  return drizzle(client)
}

export const db = createDb()
export type Db = typeof db
