/**
 * Public logging contract.
 * All layers call this interface — they never instantiate a logger directly.
 *
 * Extension points for future iterations:
 * - Add correlationId to LogMeta conventions (document the key name)
 * - Add a structured/JSON output mode to Logger (new implementation, same interface)
 * - Add provider adapters (Sentry, Datadog) as Logger implementations
 */
export type LogMeta = Record<string, unknown>

export interface Logger {
  debug(message: string, meta?: LogMeta): void
  info(message: string, meta?: LogMeta): void
  warn(message: string, meta?: LogMeta): void
  error(message: string, meta?: LogMeta): void
}
