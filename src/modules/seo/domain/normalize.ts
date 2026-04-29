/**
 * Route normalization + forbidden-route detection — pure functions, server
 * and client-safe (used by Zod refinements + the metadata helper at runtime).
 *
 * Reserved prefixes mirror the robots.txt baseline so SEO entries can never
 * apply to admin / api / dev / login surfaces.
 */

const FORBIDDEN_PREFIXES: ReadonlyArray<string> = ['/admin', '/api', '/dev', '/login']

/**
 * Normalize a raw route string for storage and lookup.
 *
 *   ' /Foo/bar/ '  → '/Foo/bar'
 *   '/foo?x=1'     → '/foo'
 *   '/foo#hash'    → '/foo'
 *   '/'            → '/'
 *
 * Case is preserved — paths are case-sensitive in many setups.
 * Trailing slashes are removed except for the root.
 * Query strings and hash fragments are stripped.
 */
export function normalizeRoute(raw: string): string {
  let route = raw.trim()

  const queryIdx = route.indexOf('?')
  if (queryIdx >= 0) route = route.slice(0, queryIdx)

  const hashIdx = route.indexOf('#')
  if (hashIdx >= 0) route = route.slice(0, hashIdx)

  if (route.length > 1 && route.endsWith('/')) {
    route = route.slice(0, -1)
  }

  return route
}

/**
 * True when the (normalized) route falls under a reserved prefix.
 * Used by Zod refinement and as a runtime safety check.
 *
 *   '/admin'         → true
 *   '/admin/users'   → true
 *   '/administrator' → false   (not a sub-path of /admin)
 *   '/api'           → true
 *   '/blog'          → false
 */
export function isForbiddenSeoRoute(rawRoute: string): boolean {
  const route = normalizeRoute(rawRoute)
  return FORBIDDEN_PREFIXES.some((prefix) => route === prefix || route.startsWith(prefix + '/'))
}
