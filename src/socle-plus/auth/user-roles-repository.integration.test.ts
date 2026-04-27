import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { db } from '@/socle-plus/database/db-client'
import { getUserRole, setUserRole } from './user-roles-repository'

// Requires DATABASE_URL pointing to a live PostgreSQL test database.
// Run with: npm run test:integration

const TEST_UUID_1 = '00000000-0000-0000-0000-000000000001'
const TEST_UUID_2 = '00000000-0000-0000-0000-000000000002'

async function createTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id     UUID         PRIMARY KEY,
      role        VARCHAR(50)  NOT NULL CHECK (role IN ('admin', 'super_admin')),
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)
}

async function dropTable(): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS user_roles`)
}

async function clearTable(): Promise<void> {
  await db.execute(sql`DELETE FROM user_roles`)
}

// ---------------------------------------------------------------------------
// getUserRole
// ---------------------------------------------------------------------------

describe('getUserRole', () => {
  beforeAll(createTable)
  afterAll(dropTable)
  beforeEach(clearTable)

  it('returns null when the user has no role row', async () => {
    expect(await getUserRole(TEST_UUID_1)).toBeNull()
  })

  it('returns admin when the user has an admin row', async () => {
    await db.execute(sql`INSERT INTO user_roles (user_id, role) VALUES (${TEST_UUID_1}, 'admin')`)
    expect(await getUserRole(TEST_UUID_1)).toBe('admin')
  })

  it('returns super_admin when the user has a super_admin row', async () => {
    await db.execute(sql`INSERT INTO user_roles (user_id, role) VALUES (${TEST_UUID_2}, 'super_admin')`)
    expect(await getUserRole(TEST_UUID_2)).toBe('super_admin')
  })

  it('returns null for a different user even when other users have roles', async () => {
    await db.execute(sql`INSERT INTO user_roles (user_id, role) VALUES (${TEST_UUID_1}, 'admin')`)
    expect(await getUserRole(TEST_UUID_2)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// setUserRole
// ---------------------------------------------------------------------------

describe('setUserRole', () => {
  beforeAll(createTable)
  afterAll(dropTable)
  beforeEach(clearTable)

  it('inserts a new admin role', async () => {
    await setUserRole(TEST_UUID_1, 'admin')
    expect(await getUserRole(TEST_UUID_1)).toBe('admin')
  })

  it('inserts a new super_admin role', async () => {
    await setUserRole(TEST_UUID_1, 'super_admin')
    expect(await getUserRole(TEST_UUID_1)).toBe('super_admin')
  })

  it('updates an existing role on conflict (upsert)', async () => {
    await setUserRole(TEST_UUID_1, 'admin')
    await setUserRole(TEST_UUID_1, 'super_admin')
    expect(await getUserRole(TEST_UUID_1)).toBe('super_admin')
  })

  it('is idempotent — setting the same role twice does not throw', async () => {
    await setUserRole(TEST_UUID_1, 'admin')
    await expect(setUserRole(TEST_UUID_1, 'admin')).resolves.not.toThrow()
  })

  it('does not affect other users', async () => {
    await setUserRole(TEST_UUID_1, 'admin')
    expect(await getUserRole(TEST_UUID_2)).toBeNull()
  })
})
