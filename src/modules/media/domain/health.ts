import 'server-only'

import { db } from '@/socle-plus/database'
import type { HealthCheck } from '@/socle/health'
import { getEnv } from '@/socle/config/env'
import { logger } from '@/socle/logger'
import { mediaAssets } from '../data/schema'
import { isStorageBucketReady } from './storage'

/**
 * Health checks for the Media module.
 *
 * Two probes:
 *   1. Database — confirms the `media_assets` table is reachable. Catches
 *      the "migration 0006 not run yet" deployment trap.
 *   2. Storage — confirms the Supabase bucket exists and is reachable.
 *      Catches "env missing" + "bucket not created in dashboard" + outages.
 *
 * Both probes mirror the Socle/Socle+ health pattern: error message is
 * generic in production (no driver / network detail leaked), detailed in
 * dev / test. The full error is always logged server-side for diagnostics.
 *
 * Surfaced today by `/dev/modules` (the dev module catalog). A future
 * `/api/health` integration could merge these into the global aggregator.
 */

const GENERIC_DB_ERROR = 'Media database check failed'
const GENERIC_STORAGE_ERROR = 'Media storage check failed'

function isProduction(): boolean {
  return getEnv('NODE_ENV') === 'production'
}

export async function checkMediaDatabase(): Promise<HealthCheck> {
  try {
    // Light query — the row content is irrelevant; we only need to confirm
    // the table is reachable. Postgres throws if the table is missing.
    await db.select({ id: mediaAssets.id }).from(mediaAssets).limit(1)
    return { name: 'media.db', status: 'ok' }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown database error'
    logger.error('[media.health] db check failed', { error: detail })
    return {
      name: 'media.db',
      status: 'degraded',
      message: isProduction() ? GENERIC_DB_ERROR : detail,
    }
  }
}

export async function checkMediaStorage(): Promise<HealthCheck> {
  const result = await isStorageBucketReady()
  if (result.ok) return { name: 'media.storage', status: 'ok' }

  const reason = result.reason ?? 'Unknown storage error'
  logger.error('[media.health] storage check failed', { error: reason })
  return {
    name: 'media.storage',
    status: 'degraded',
    message: isProduction() ? GENERIC_STORAGE_ERROR : reason,
  }
}

/**
 * Aggregator for module-level health UIs (e.g. `/dev/modules`). Returns
 * an array of HealthChecks identical in shape to the Socle / Socle+
 * runners — easy to merge into `runSoclePlusChecks` or a future global
 * aggregator if/when desired.
 */
export async function runMediaChecks(): Promise<readonly HealthCheck[]> {
  return Promise.all([checkMediaDatabase(), checkMediaStorage()])
}
