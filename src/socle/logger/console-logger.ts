import type { Logger, LogMeta } from './logger.types'
import { type LogLevel, shouldLog } from './log-level'
import { sanitizeMeta } from './safe-meta'

export interface ConsoleLoggerOptions {
  level: LogLevel
  /**
   * When true, suppresses all output. Intended for test environments.
   * Tests should create loggers via createLogger() rather than relying
   * on the singleton, and spy on console methods to assert behavior.
   */
  silent?: boolean
}

/**
 * Default Logger implementation. Writes to the Node.js console.
 *
 * Future extension points (do not implement until needed):
 * - JSON output mode: add a `format: 'text' | 'json'` option
 * - Correlation ID: read from AsyncLocalStorage and prepend to output
 * - External provider: replace this class with an adapter (keep Logger interface)
 */
export class ConsoleLogger implements Logger {
  private readonly level: LogLevel
  private readonly silent: boolean

  constructor(options: ConsoleLoggerOptions) {
    this.level = options.level
    this.silent = options.silent ?? false
  }

  debug(message: string, meta?: LogMeta): void {
    this.write('debug', message, meta)
  }

  info(message: string, meta?: LogMeta): void {
    this.write('info', message, meta)
  }

  warn(message: string, meta?: LogMeta): void {
    this.write('warn', message, meta)
  }

  error(message: string, meta?: LogMeta): void {
    this.write('error', message, meta)
  }

  private write(level: LogLevel, message: string, meta?: LogMeta): void {
    if (this.silent || !shouldLog(this.level, level)) return

    const timestamp = new Date().toISOString()
    const text = `[${level.toUpperCase()}] [${timestamp}] ${message}`
    const safe = meta !== undefined ? sanitizeMeta(meta) : undefined

    if (safe !== undefined) {
      switch (level) {
        case 'debug': console.debug(text, safe); break
        case 'info':  console.info(text, safe);  break
        case 'warn':  console.warn(text, safe);  break
        case 'error': console.error(text, safe); break
      }
    } else {
      switch (level) {
        case 'debug': console.debug(text); break
        case 'info':  console.info(text);  break
        case 'warn':  console.warn(text);  break
        case 'error': console.error(text); break
      }
    }
  }
}
