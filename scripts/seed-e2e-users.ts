/**
 * E2E user seed — idempotent.
 *
 * Creates (or updates) three test users for Playwright E2E tests:
 *   1. super_admin — Supabase user + user_roles row with role='super_admin'
 *   2. admin       — Supabase user + user_roles row with role='admin'
 *   3. no-role     — Supabase user only; no row in user_roles
 *
 * Reads credentials from environment variables:
 *   - SUPABASE_URL, SUPABASE_SERVICE_KEY (for admin operations)
 *   - DATABASE_URL                       (for Drizzle access to user_roles)
 *   - E2E_SUPER_ADMIN_EMAIL / _PASSWORD
 *   - E2E_ADMIN_EMAIL / _PASSWORD
 *   - E2E_USER_EMAIL / _PASSWORD
 *
 * Behavior:
 *   - If a user does not exist in Supabase Auth, create them (email_confirm = true
 *     so they can log in immediately without email verification).
 *   - If a user exists, update their password to the current env value.
 *     This handles password rotation between runs and ensures the seed is
 *     authoritative.
 *   - For the role-bearing users, upsert the user_roles row.
 *   - For the no-role user, ensure no user_roles row exists.
 *
 * Security:
 *   - Passwords are never logged.
 *   - Service key is read once and never echoed.
 *   - The script must run in a Node context — never bundled into the browser.
 *
 * Run via:  npm run seed:e2e
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { eq } from 'drizzle-orm'
import { getEnv } from '@/socle/config/env'
import { db } from '@/socle-plus/database/db-client'
import { userRoles } from '@/socle-plus/auth/schema'
import { setUserRole } from '@/socle-plus/auth/user-roles-repository'
import type { UserRole } from '@/socle-plus/auth/auth.types'

interface E2EUserSpec {
  /** Display label for log messages — never the password. */
  label: string
  email: string
  password: string
  /** null means: ensure no row in user_roles for this user. */
  role: UserRole | null
}

function requireEnv(key: string): string {
  const value = getEnv(key)
  if (value === undefined || value === '') {
    throw new Error(`${key} is required to run the e2e seed`)
  }
  return value
}

function loadSpecs(): E2EUserSpec[] {
  return [
    {
      label: 'super_admin',
      email: requireEnv('E2E_SUPER_ADMIN_EMAIL'),
      password: requireEnv('E2E_SUPER_ADMIN_PASSWORD'),
      role: 'super_admin',
    },
    {
      label: 'admin',
      email: requireEnv('E2E_ADMIN_EMAIL'),
      password: requireEnv('E2E_ADMIN_PASSWORD'),
      role: 'admin',
    },
    {
      label: 'no-role user',
      email: requireEnv('E2E_USER_EMAIL'),
      password: requireEnv('E2E_USER_PASSWORD'),
      role: null,
    },
  ]
}

function buildAdminClient(): SupabaseClient {
  const url = requireEnv('SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_KEY')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const PAGE_SIZE = 1000

async function findUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  let page = 1
  // Pagination loop — small test environments will exit on the first page.
  // Capped to avoid runaway loops on misconfigured projects.
  for (let safety = 0; safety < 100; safety++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) throw new Error(`listUsers failed: ${error.message}`)

    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match

    if (data.users.length < PAGE_SIZE) return null
    page++
  }
  return null
}

async function ensureSupabaseUser(
  admin: SupabaseClient,
  spec: E2EUserSpec,
): Promise<string> {
  const existing = await findUserByEmail(admin, spec.email)

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: spec.password,
      email_confirm: true,
    })
    if (error) throw new Error(`updateUserById failed for ${spec.email}: ${error.message}`)
    console.log(`  ✓ ${spec.label}: existing Supabase user (${spec.email}), password synced`)
    return existing.id
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: spec.email,
    password: spec.password,
    email_confirm: true,
  })
  if (error) throw new Error(`createUser failed for ${spec.email}: ${error.message}`)
  if (!data.user) throw new Error(`createUser returned no user for ${spec.email}`)
  console.log(`  ✓ ${spec.label}: created Supabase user (${spec.email})`)
  return data.user.id
}

async function ensureRole(userId: string, role: UserRole | null, label: string): Promise<void> {
  if (role === null) {
    await db.delete(userRoles).where(eq(userRoles.userId, userId))
    console.log(`  ✓ ${label}: ensured no user_roles row`)
    return
  }
  await setUserRole(userId, role)
  console.log(`  ✓ ${label}: user_roles role set to "${role}"`)
}

async function main(): Promise<void> {
  console.log('[seed:e2e] starting')

  const specs = loadSpecs()
  const admin = buildAdminClient()

  for (const spec of specs) {
    console.log(`[seed:e2e] ${spec.label}`)
    const userId = await ensureSupabaseUser(admin, spec)
    await ensureRole(userId, spec.role, spec.label)
  }

  console.log('[seed:e2e] done')
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[seed:e2e] failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
