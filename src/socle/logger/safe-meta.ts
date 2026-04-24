import type { LogMeta } from './logger.types'

// Keys whose normalized form contains any of these strings are redacted.
// Normalization: lowercase + strip hyphens and underscores.
// Examples: "accessToken", "ACCESS_TOKEN", "access-token" all match "token".
const SENSITIVE_PATTERNS: readonly string[] = [
  'password',
  'passwd',
  'secret',
  'token',
  'apikey',
  'privatekey',
  'authorization',
  'cookie',
  'creditcard',
  'cvv',
  'ssn',
]

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, '')
  return SENSITIVE_PATTERNS.some((pattern) => normalized.includes(pattern))
}

/**
 * Best-effort redaction of known sensitive keys from a log meta object.
 * This is a safety net, not a substitute for keeping secrets out of logs.
 * Never pass raw request bodies, JWT payloads, or credentials as meta.
 */
export function sanitizeMeta(meta: LogMeta): LogMeta {
  const result: LogMeta = {}
  for (const [key, value] of Object.entries(meta)) {
    result[key] = isSensitiveKey(key) ? '[REDACTED]' : value
  }
  return result
}
