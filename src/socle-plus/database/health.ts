import { sql } from 'drizzle-orm'
import type { HealthCheck } from '@/socle/health'
import { getEnv } from '@/socle/config/env'
import { logger } from '@/socle/logger'
import { db } from './db-client'

const GENERIC_DB_ERROR_MESSAGE = 'Database health check failed'

export async function checkDatabaseHealth(): Promise<HealthCheck> {
  try {
    await db.execute(sql`SELECT 1`)
    return { name: 'database', status: 'ok' }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown database error'

    // Always log the underlying cause server-side for diagnostics.
    // The structured logger sanitizes meta values before output.
    logger.error('[health] database check failed', { error: detail })

    // In production, the response message must not leak driver internals,
    // hostnames, credentials, or stack details. /api/health may sit on a
    // public surface (load balancer probes, status pages).
    const isProduction = getEnv('NODE_ENV') === 'production'
    return {
      name: 'database',
      status: 'degraded',
      message: isProduction ? GENERIC_DB_ERROR_MESSAGE : detail,
    }
  }
}

/**
 * Aggregates all Socle+ health checks. The /api/health route spreads this
 * alongside runSocleChecks() so both layers are reported in a single response.
 *
 * Promise.all keeps the perf characteristic stable as more Socle+ subsystems
 * (auth, audit, etc.) add their own checks here.
 */
export async function runSoclePlusChecks(): Promise<readonly HealthCheck[]> {
  return Promise.all([
    checkDatabaseHealth(),
  ])
}
