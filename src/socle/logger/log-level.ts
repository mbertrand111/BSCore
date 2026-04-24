export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const VALID_LEVELS = new Set<string>(['debug', 'info', 'warn', 'error'])

export function isLogLevel(value: string): value is LogLevel {
  return VALID_LEVELS.has(value)
}

export function parseLogLevel(
  raw: string | undefined,
  fallback: LogLevel,
): LogLevel {
  if (raw !== undefined && isLogLevel(raw)) {
    return raw
  }
  return fallback
}

export function shouldLog(activeLevel: LogLevel, messageLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[messageLevel] >= LOG_LEVEL_ORDER[activeLevel]
}
