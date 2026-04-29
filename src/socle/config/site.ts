import { getEnv } from './env'

/**
 * Site URL config — single source of truth for the public origin.
 *
 * Read from `NEXT_PUBLIC_APP_URL` (documented in .env.example).
 *
 * Behavior by environment:
 *   - production: NEXT_PUBLIC_APP_URL is REQUIRED. Missing or invalid value
 *     throws an explicit error — the build fails fast or, at runtime, the
 *     request 500s with a clear message rather than silently emitting a
 *     localhost sitemap / canonical to crawlers.
 *   - development / test / any non-production NODE_ENV: missing or invalid
 *     value falls back to a dev-safe localhost URL so contributors can
 *     boot the app without configuration.
 *
 * Returns the origin only (scheme + host + port). Path / query / hash are
 * stripped so callers can safely concatenate `${getSiteUrl()}/path`.
 */
const DEV_FALLBACK = 'http://localhost:7777'

function isProduction(): boolean {
  return getEnv('NODE_ENV') === 'production'
}

export function getSiteUrl(): string {
  const raw = getEnv('NEXT_PUBLIC_APP_URL')

  if (raw === undefined || raw === '') {
    if (isProduction()) {
      throw new Error(
        'NEXT_PUBLIC_APP_URL is required in production but is not set. ' +
          'Set it to the public origin (e.g. https://acme.com) in the deployment environment.',
      )
    }
    return DEV_FALLBACK
  }

  try {
    return new URL(raw).origin
  } catch {
    if (isProduction()) {
      throw new Error(
        `NEXT_PUBLIC_APP_URL has an invalid value (${JSON.stringify(raw)}). ` +
          'It must be a fully qualified absolute URL such as https://acme.com.',
      )
    }
    return DEV_FALLBACK
  }
}

/**
 * Same value as `getSiteUrl()`, but returned as a `URL` object — useful
 * for Next.js's `metadataBase` which expects a parsed URL.
 */
export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl())
}
