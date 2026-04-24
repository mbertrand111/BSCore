import { readdir } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { logger } from '@/socle/logger'
import { toAppError } from '@/socle/errors'
import {
  ensureMigrationsTable,
  getAppliedMigrationIds,
  recordMigration,
} from './migration-table'
import type { Db } from './db-client'
import type { Migration } from './migration-types'

// Matches filenames like: 20260424_0001_description.ts / .js / .mjs
const MIGRATION_FILE_RE = /^\d{8,}_.+\.(ts|js|mjs)$/

export function sortMigrationsByFilename(migrations: readonly Migration[]): readonly Migration[] {
  return [...migrations].sort((a, b) => a.id.localeCompare(b.id))
}

export function validateUniqueMigrationIds(migrations: readonly Migration[]): void {
  const seen = new Set<string>()
  for (const m of migrations) {
    if (seen.has(m.id)) {
      throw new Error(
        `Duplicate migration ID "${m.id}". ` +
          'Each migration file must have a unique name across all directories.',
      )
    }
    seen.add(m.id)
  }
}

async function loadFromDir(dir: string): Promise<Migration[]> {
  if (!existsSync(dir)) return []

  const entries = await readdir(dir)
  const files = entries.filter(f => MIGRATION_FILE_RE.test(f)).sort()

  const migrations: Migration[] = []
  for (const file of files) {
    const id = basename(file, extname(file))
    const absolutePath = join(dir, file)
    // Dynamic import by file URL — safe for ESM and tsx execution.
    // Migration files are never imported through the Next.js bundler.
    const mod: unknown = await import(pathToFileURL(absolutePath).href)

    if (
      typeof mod !== 'object' ||
      mod === null ||
      !('up' in mod) ||
      typeof (mod as Record<string, unknown>)['up'] !== 'function'
    ) {
      throw new Error(
        `Migration "${file}" does not export an up() function. ` +
          'Expected: export async function up(db: Db): Promise<void>',
      )
    }

    migrations.push({ id, up: (mod as { up: Migration['up'] }).up })
  }

  return migrations
}

async function resolveDefaultDirs(): Promise<readonly string[]> {
  const cwd = process.cwd()
  const dirs: string[] = []

  // src/socle-plus/*/migrations/
  const soclePlusBase = join(cwd, 'src', 'socle-plus')
  if (existsSync(soclePlusBase)) {
    const soclePlusEntries = await readdir(soclePlusBase, { withFileTypes: true })
    for (const entry of soclePlusEntries) {
      if (entry.isDirectory()) {
        const migrationsDir = join(soclePlusBase, entry.name, 'migrations')
        if (existsSync(migrationsDir)) dirs.push(migrationsDir)
      }
    }
  }

  // src/modules/*/data/migrations/
  const modulesBase = join(cwd, 'src', 'modules')
  if (existsSync(modulesBase)) {
    const moduleEntries = await readdir(modulesBase, { withFileTypes: true })
    for (const entry of moduleEntries) {
      if (entry.isDirectory()) {
        const migrationsDir = join(modulesBase, entry.name, 'data', 'migrations')
        if (existsSync(migrationsDir)) dirs.push(migrationsDir)
      }
    }
  }

  return dirs
}

export async function applyMigrations(
  targetDb: Db,
  migrations: readonly Migration[],
): Promise<void> {
  await ensureMigrationsTable(targetDb)
  const appliedIds = await getAppliedMigrationIds(targetDb)

  const sorted = sortMigrationsByFilename(migrations)
  validateUniqueMigrationIds(sorted)

  let applied = 0
  for (const migration of sorted) {
    if (appliedIds.has(migration.id)) {
      logger.debug(`[migrations] skip (already applied): ${migration.id}`)
      continue
    }

    logger.info(`[migrations] applying: ${migration.id}`)

    try {
      await migration.up(targetDb)
      await recordMigration(targetDb, migration.id)
      applied++
      logger.info(`[migrations] applied: ${migration.id}`)
    } catch (error) {
      const appError = toAppError(error)
      logger.error(`[migrations] failed: ${migration.id}`, {
        code: appError.code,
        message: appError.message,
      })
      throw appError
    }
  }

  if (applied === 0) {
    logger.info('[migrations] nothing to apply — all migrations already up to date')
  } else {
    logger.info(`[migrations] done — ${applied} migration(s) applied`)
  }
}

export async function runMigrations(dirs?: readonly string[]): Promise<void> {
  const targetDirs = dirs ?? (await resolveDefaultDirs())

  logger.info('[migrations] starting discovery', { count: targetDirs.length })

  const allMigrations: Migration[] = []
  for (const dir of targetDirs) {
    const found = await loadFromDir(dir)
    if (found.length > 0) {
      logger.debug(`[migrations] found ${found.length} file(s) in ${dir}`)
    }
    allMigrations.push(...found)
  }

  logger.info(`[migrations] ${allMigrations.length} migration file(s) discovered`)

  // Lazy import: db-client initialises the connection only when runMigrations is called.
  // This prevents DATABASE_URL from being required at module-import time in unit tests.
  const { db } = await import('./db-client')
  await applyMigrations(db, allMigrations)
}
