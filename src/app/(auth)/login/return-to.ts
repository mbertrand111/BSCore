/**
 * Validates a `returnTo` query parameter against the open-redirect threat
 * documented in SECURITY_RULES.md §11.
 *
 * Allowed: relative same-origin paths starting with `/`, not pointing back
 * to /login itself.
 *
 * Rejected (returns the safe fallback):
 *   - non-string values
 *   - absolute URLs (http://, https://, etc.)
 *   - protocol-relative URLs (//evil.com)
 *   - backslash-prefixed paths (some browsers treat as /)
 *   - /login or any /login? /login/ variation (avoids redirect loops)
 *   - paths containing control characters or whitespace
 */
const SAFE_FALLBACK = '/admin'

export function safeReturnTo(raw: string | null | undefined): string {
  if (typeof raw !== 'string' || raw.length === 0) return SAFE_FALLBACK

  // Reject control chars and whitespace anywhere in the value
  if (/[\s\x00-\x1f\x7f]/.test(raw)) return SAFE_FALLBACK

  // Must start with a single forward slash
  if (raw[0] !== '/') return SAFE_FALLBACK

  // Reject protocol-relative URLs (//host) and backslash variants (/\host)
  if (raw.startsWith('//') || raw.startsWith('/\\')) return SAFE_FALLBACK

  // Reject /login and any /login* path (loop prevention)
  if (raw === '/login' || raw.startsWith('/login?') || raw.startsWith('/login/') || raw.startsWith('/login#')) {
    return SAFE_FALLBACK
  }

  return raw
}

export const RETURN_TO_FALLBACK = SAFE_FALLBACK
