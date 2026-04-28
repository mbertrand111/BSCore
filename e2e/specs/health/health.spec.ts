import { test, expect } from '@playwright/test'

// Sanity test for /api/health.
//
// In environments without DATABASE_URL, the database check is degraded and
// the endpoint returns 503 — that is also a valid "the route is working"
// signal. We assert on shape rather than status so the test passes both in
// fully-configured environments (200) and in CI without a DB (503).

interface HealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  service: string
  checks: Array<{ name: string; status: 'ok' | 'degraded'; message?: string }>
}

test('/api/health returns the expected shape', async ({ request }) => {
  const response = await request.get('/api/health')

  // 200 when everything is ok, 503 when at least one check is degraded.
  expect([200, 503]).toContain(response.status())

  const cacheControl = response.headers()['cache-control']
  expect(cacheControl).toBe('no-store')

  const body = (await response.json()) as HealthResponse
  expect(body.status).toMatch(/^(ok|degraded)$/)
  expect(typeof body.service).toBe('string')
  expect(typeof body.timestamp).toBe('string')
  expect(Array.isArray(body.checks)).toBe(true)
  expect(body.checks.length).toBeGreaterThanOrEqual(2) // at least app + config

  for (const check of body.checks) {
    expect(typeof check.name).toBe('string')
    expect(check.status).toMatch(/^(ok|degraded)$/)
  }

  // Both Socle baseline checks must be present.
  const checkNames = body.checks.map((c) => c.name)
  expect(checkNames).toContain('app')
  expect(checkNames).toContain('config')
})
