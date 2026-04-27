import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { sql, eq } from 'drizzle-orm'
import { db } from '@/socle-plus/database/db-client'
import { writeAuditEvent } from './audit-service'
import { AUDIT_EVENTS } from './audit-events'
import { auditEvents } from './audit.schema'

// Requires DATABASE_URL pointing to a live PostgreSQL test database.
// Run with: npm run test:integration

async function createTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_events (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      event       TEXT         NOT NULL,
      user_id     UUID         NULL,
      actor_id    UUID         NULL,
      meta        JSONB        NULL,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)
}

async function dropTable(): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS audit_events`)
}

async function clearTable(): Promise<void> {
  await db.execute(sql`DELETE FROM audit_events`)
}

const USER_1 = '00000000-0000-0000-0000-000000000001'
const USER_2 = '00000000-0000-0000-0000-000000000002'

describe('writeAuditEvent', () => {
  beforeAll(createTable)
  afterAll(dropTable)
  beforeEach(clearTable)

  it('inserts a row with the correct event name', async () => {
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED)
    const rows = await db.select().from(auditEvents)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.event).toBe('user.role_changed')
  })

  it('stores userId when provided', async () => {
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_ASSIGNED, { userId: USER_1 })
    const rows = await db.select().from(auditEvents)
    expect(rows[0]?.userId).toBe(USER_1)
  })

  it('stores actorId when provided', async () => {
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_ASSIGNED, {
      userId: USER_1,
      actorId: USER_2,
    })
    const rows = await db.select().from(auditEvents)
    expect(rows[0]?.actorId).toBe(USER_2)
  })

  it('stores meta as JSONB when provided', async () => {
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED, {
      userId: USER_1,
      meta: { from: 'admin', to: 'super_admin' },
    })
    const rows = await db.select().from(auditEvents)
    expect(rows[0]?.meta).toEqual({ from: 'admin', to: 'super_admin' })
  })

  it('stores null userId and actorId when not provided', async () => {
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION)
    const rows = await db.select().from(auditEvents)
    expect(rows[0]?.userId).toBeNull()
    expect(rows[0]?.actorId).toBeNull()
  })

  it('stores null meta when not provided', async () => {
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION)
    const rows = await db.select().from(auditEvents)
    expect(rows[0]?.meta).toBeNull()
  })

  it('auto-generates a UUID id', async () => {
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED, { userId: USER_1 })
    const rows = await db.select().from(auditEvents)
    expect(rows[0]?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it('sets created_at automatically', async () => {
    const before = new Date()
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED, { userId: USER_1 })
    const after = new Date()
    const rows = await db.select().from(auditEvents)
    const ts = rows[0]?.createdAt
    expect(ts).toBeDefined()
    expect(ts!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(ts!.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('writes multiple independent events', async () => {
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_ASSIGNED, { userId: USER_1 })
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED, { userId: USER_1 })
    await writeAuditEvent(AUDIT_EVENTS.ADMIN_ACTION, { actorId: USER_2 })
    const rows = await db.select().from(auditEvents)
    expect(rows).toHaveLength(3)
  })

  it('rows from different users are isolated', async () => {
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_ASSIGNED, { userId: USER_1 })
    await writeAuditEvent(AUDIT_EVENTS.USER_ROLE_ASSIGNED, { userId: USER_2 })
    const rowsForUser1 = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.userId, USER_1))
    expect(rowsForUser1).toHaveLength(1)
    expect(rowsForUser1[0]?.userId).toBe(USER_1)
  })

  it('accepts unknown event strings (no constraint on event column)', async () => {
    await expect(writeAuditEvent('custom.module.event')).resolves.not.toThrow()
    const rows = await db.select().from(auditEvents)
    expect(rows[0]?.event).toBe('custom.module.event')
  })
})
