import type { Db } from './db-client'

export type MigrationFn = (db: Db) => Promise<void>

export interface Migration {
  readonly id: string
  readonly up: MigrationFn
}

export interface MigrationRecord {
  readonly id: string
  readonly appliedAt: Date
}
