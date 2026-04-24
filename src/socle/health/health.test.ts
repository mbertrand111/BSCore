import { describe, it, expect, vi, afterEach } from 'vitest'
import { createHealthReport, getServiceName, runSocleChecks } from './health-check'
import type { HealthCheck } from './health.types'

// ---------------------------------------------------------------------------
// createHealthReport
// ---------------------------------------------------------------------------

describe('createHealthReport', () => {
  it('sets status ok when all checks pass', () => {
    const checks: HealthCheck[] = [
      { name: 'a', status: 'ok' },
      { name: 'b', status: 'ok' },
    ]
    const report = createHealthReport('TestService', checks)
    expect(report.status).toBe('ok')
  })

  it('sets status degraded when any check is degraded', () => {
    const checks: HealthCheck[] = [
      { name: 'a', status: 'ok' },
      { name: 'b', status: 'degraded' },
    ]
    const report = createHealthReport('TestService', checks)
    expect(report.status).toBe('degraded')
  })

  it('sets status degraded when all checks are degraded', () => {
    const checks: HealthCheck[] = [
      { name: 'a', status: 'degraded' },
      { name: 'b', status: 'degraded' },
    ]
    const report = createHealthReport('TestService', checks)
    expect(report.status).toBe('degraded')
  })

  it('sets status ok when checks array is empty', () => {
    const report = createHealthReport('TestService', [])
    expect(report.status).toBe('ok')
  })

  it('includes the provided service name', () => {
    const report = createHealthReport('MySvc', [])
    expect(report.service).toBe('MySvc')
  })

  it('includes all provided checks unchanged', () => {
    const checks: HealthCheck[] = [
      { name: 'app', status: 'ok' },
      { name: 'config', status: 'ok' },
    ]
    const report = createHealthReport('TestService', checks)
    expect(report.checks).toHaveLength(2)
    expect(report.checks[0]).toEqual({ name: 'app', status: 'ok' })
    expect(report.checks[1]).toEqual({ name: 'config', status: 'ok' })
  })

  it('sets timestamp to a valid ISO 8601 string', () => {
    const before = new Date()
    const report = createHealthReport('TestService', [])
    const after = new Date()
    const ts = new Date(report.timestamp)
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})

// ---------------------------------------------------------------------------
// runSocleChecks — normal environment
// ---------------------------------------------------------------------------

describe('runSocleChecks', () => {
  it('returns two checks', async () => {
    const checks = await runSocleChecks()
    expect(checks).toHaveLength(2)
  })

  it('includes an app check', async () => {
    const checks = await runSocleChecks()
    const app = checks.find(c => c.name === 'app')
    expect(app).toBeDefined()
  })

  it('includes a config check', async () => {
    const checks = await runSocleChecks()
    const config = checks.find(c => c.name === 'config')
    expect(config).toBeDefined()
  })

  it('app check is always ok', async () => {
    const checks = await runSocleChecks()
    const app = checks.find(c => c.name === 'app')
    expect(app?.status).toBe('ok')
  })

  it('config check is ok when NODE_ENV is a recognized value', async () => {
    // Vitest sets NODE_ENV=test — a known environment
    const checks = await runSocleChecks()
    const config = checks.find(c => c.name === 'config')
    expect(config?.status).toBe('ok')
  })
})

// ---------------------------------------------------------------------------
// config check — degraded paths
// ---------------------------------------------------------------------------

describe('runSocleChecks — config check degraded paths', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('config check is degraded when NODE_ENV is an unrecognized value', async () => {
    vi.stubEnv('NODE_ENV', 'staging_unknown')
    const checks = await runSocleChecks()
    const config = checks.find(c => c.name === 'config')
    expect(config?.status).toBe('degraded')
    expect(typeof config?.message).toBe('string')
  })

  it('config check degraded message is a non-empty string', async () => {
    vi.stubEnv('NODE_ENV', 'unknown')
    const checks = await runSocleChecks()
    const config = checks.find(c => c.name === 'config')
    expect((config?.message ?? '').length).toBeGreaterThan(0)
  })

  it('config check is ok when NODE_ENV is development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const checks = await runSocleChecks()
    const config = checks.find(c => c.name === 'config')
    expect(config?.status).toBe('ok')
  })

  it('config check is ok when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const checks = await runSocleChecks()
    const config = checks.find(c => c.name === 'config')
    expect(config?.status).toBe('ok')
  })
})

// ---------------------------------------------------------------------------
// getServiceName
// ---------------------------------------------------------------------------

describe('getServiceName', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('returns APP_NAME from env when set to a non-empty value', () => {
    vi.stubEnv('APP_NAME', 'MyApp')
    expect(getServiceName()).toBe('MyApp')
  })

  it('falls back to BSCore when APP_NAME is an empty string', () => {
    // Empty string is treated as absent — same as not set.
    // Uses || rather than ?? so falsy values all fall back to the default.
    vi.stubEnv('APP_NAME', '')
    expect(getServiceName()).toBe('BSCore')
  })
})
