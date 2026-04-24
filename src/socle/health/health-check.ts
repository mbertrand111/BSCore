import { getEnv } from '@/socle/config/env'
import type { HealthCheck, HealthReport, HealthStatus } from './health.types'

const KNOWN_ENVIRONMENTS: readonly string[] = ['development', 'test', 'production']

/**
 * Returns the service name for health reports.
 * Uses APP_NAME env var if set, falls back to 'BSCore'.
 */
export function getServiceName(): string {
  return getEnv('APP_NAME') || 'BSCore'
}

/**
 * Assembles a HealthReport from a service name and a list of checks.
 * Status is 'degraded' if any check is degraded, otherwise 'ok'.
 * Designed to be called by the route handler with Socle checks and,
 * in future, additional Socle+ checks passed alongside.
 */
export function createHealthReport(
  service: string,
  checks: readonly HealthCheck[],
): HealthReport {
  const status: HealthStatus = checks.some(c => c.status === 'degraded') ? 'degraded' : 'ok'
  return {
    status,
    timestamp: new Date().toISOString(),
    service,
    checks,
  }
}

/**
 * Returns the Socle-level health checks.
 * Verifies only that the application can respond and config is readable.
 * No database, no auth, no modules.
 *
 * Socle+ will provide its own check runner (runSoclePlusChecks) that the
 * route handler spreads alongside these when Socle+ is active.
 */
export async function runSocleChecks(): Promise<readonly HealthCheck[]> {
  return [checkApp(), checkConfig()]
}

function checkApp(): HealthCheck {
  return { name: 'app', status: 'ok' }
}

function checkConfig(): HealthCheck {
  const env = getEnv('NODE_ENV')
  if (env === undefined || !KNOWN_ENVIRONMENTS.includes(env)) {
    return {
      name: 'config',
      status: 'degraded',
      message: 'NODE_ENV is not set or not a recognized environment',
    }
  }
  return { name: 'config', status: 'ok' }
}
