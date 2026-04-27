import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { getEnv } from '@/socle/config/env'

let _instance: PostgresJsDatabase | undefined

function createInstance(): PostgresJsDatabase {
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

// Lazy proxy — DATABASE_URL is validated on first db method call, not at module load.
// This allows the module to be safely imported during Next.js build-time static
// analysis and in unit tests without DATABASE_URL being present in the environment.
export const db: PostgresJsDatabase = new Proxy({} as PostgresJsDatabase, {
  get(_target, prop: string | symbol): unknown {
    if (_instance === undefined) _instance = createInstance()
    const value: unknown = (_instance as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(_instance)
      : value
  },
})

export type Db = PostgresJsDatabase
