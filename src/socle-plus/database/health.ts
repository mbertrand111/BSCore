import { sql } from 'drizzle-orm'
import type { HealthCheck } from '@/socle/health'
import { db } from './db-client'

export async function checkDatabaseHealth(): Promise<HealthCheck> {
  try {
    await db.execute(sql`SELECT 1`)
    return { name: 'database', status: 'ok' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error'
    return { name: 'database', status: 'degraded', message }
  }
}
