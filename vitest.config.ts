import { defineConfig } from 'vitest/config'

// Unit test configuration.
// Runs fast, isolated tests — domain logic, pure utilities, Zod schemas.
// No database access. No HTTP calls.
// Integration tests use vitest.integration.config.ts instead.
export default defineConfig({
  resolve: {
    // Reads path aliases from tsconfig.json automatically (Vite v6+ native support).
    tsconfigPaths: true,
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/**/*.integration.test.ts', 'node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules', '.next', 'src/**/*.test.ts'],
    },
  },
})
