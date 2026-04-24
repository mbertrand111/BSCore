/**
 * Single access point for environment variables in Socle-internal code.
 * This is the only place in the codebase that reads process.env directly.
 * Full config implementation (per-environment validation, typed schema)
 * will expand this file when the Socle config system is implemented.
 */
export function getEnv(key: string): string | undefined {
  return process.env[key]
}
