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

    // Logged at WARN, not ERROR: a degraded health probe is expected
    // operational state (DB unreachable in dev, transient timeout in prod),
    // not a system failure that should page on-call. The /api/health route
    // surfaces the degraded status via the response body — that's the
    // canonical signal for monitoring.
    logger.warn('[health] database check degraded', { error: detail })

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
