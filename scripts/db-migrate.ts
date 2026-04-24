import { runMigrations } from '@/socle-plus/database/migration-runner'

async function main(): Promise<void> {
  await runMigrations()
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
