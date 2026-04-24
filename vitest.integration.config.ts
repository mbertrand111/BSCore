import { defineConfig } from 'vitest/config'

// Integration test configuration.
// Runs against a real PostgreSQL test database — never mocked.
// Requires DATABASE_URL pointing to an isolated test database.
// Longer timeouts: DB setup, migrations, seeding take real time.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    exclude: ['node_modules', '.next'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Integration tests run sequentially to avoid DB state conflicts.
    // Pool options will be configured when the first DB tests are added.
    pool: 'forks',
  },
})
