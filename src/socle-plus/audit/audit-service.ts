import 'server-only'
import { logger } from '@/socle/logger'
import { db } from '@/socle-plus/database/db-client'
import { auditEvents } from './audit.schema'

export interface AuditEventOptions {
  /** The user the event is about (the subject). */
  userId?: string | null
  /** The user who performed the action (e.g. a super_admin changing another user's role). */
  actorId?: string | null
  /**
   * Non-sensitive contextual data only.
   * Never include passwords, tokens, session IDs, or full user objects.
   */
  meta?: Record<string, unknown>
}

/**
 * Writes a structured event to the audit log.
 * This function is fail-safe: it logs unexpected errors but never throws,
 * so a DB write failure never interrupts the caller's main flow.
 */
export async function writeAuditEvent(
  event: string,
  options: AuditEventOptions = {},
): Promise<void> {
  const { userId = null, actorId = null, meta } = options

  try {
    await db.insert(auditEvents).values({
      event,
      userId,
      actorId,
      meta: meta ?? null,
    })
  } catch (error) {
    logger.error('[audit] failed to write audit event', {
      event,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
