/**
 * Baseline security headers applied to all responses.
 * These are safe defaults for every project.
 *
 * NOT included here (project-specific, configure per deployment):
 *   - Content-Security-Policy: varies by external resources used
 *   - Strict-Transport-Security: requires HTTPS — set in production only
 *   - Permissions-Policy: depends on features the project uses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  // Set to 0 to disable the buggy legacy XSS auditor in older browsers.
  // Modern browsers use CSP instead.
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const

export type SecurityHeaderName = keyof typeof SECURITY_HEADERS
