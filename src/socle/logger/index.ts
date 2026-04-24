import { getEnv } from '@/socle/config/env'
import { parseLogLevel, type LogLevel } from './log-level'
import { ConsoleLogger } from './console-logger'
import type { Logger } from './logger.types'

export type { Logger, LogMeta } from './logger.types'
export type { LogLevel } from './log-level'
export { sanitizeMeta } from './safe-meta'

interface CreateLoggerOptions {
  level: LogLevel
  silent?: boolean
}

/**
 * Factory for creating logger instances with explicit configuration.
 * Use this in tests to get a fully controlled logger without relying on env vars.
 */
export function createLogger(options: CreateLoggerOptions): Logger {
  return new ConsoleLogger(options)
}

// Environment-specific default levels when LOG_LEVEL is not set:
//   development → debug  (verbose, show everything)
//   test        → error  (silent singleton; tests create their own instances)
//   production  → info   (structured signal, no debug noise)
const nodeEnv = getEnv('NODE_ENV')

const defaultLevel: LogLevel =
  nodeEnv === 'development' ? 'debug'
  : nodeEnv === 'test' ? 'error'
  : 'info'

export const logger: Logger = new ConsoleLogger({
  level: parseLogLevel(getEnv('LOG_LEVEL'), defaultLevel),
  silent: nodeEnv === 'test',
})
