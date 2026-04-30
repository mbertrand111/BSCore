import { describe, it, expect, vi, beforeEach } from 'vitest'

// Module register hooks now reference repository helpers (count*) which import
// 'server-only'. Stub it so vitest can resolve the chain.
vi.mock('server-only', () => ({}))

// Mock the logger so registry tests don't pollute test output and we can
// assert on warning / info calls.
vi.mock('@/socle/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock the Socle+ side effects called by module register() hooks so the
// registry test stays isolated and can't leak state into other test files.
vi.mock('@/socle-plus/admin', () => ({
  registerAdminNav: vi.fn(),
}))

vi.mock('@/socle-plus/authorization', () => ({
  declarePermissions: vi.fn(),
}))

import {
  availableModules,
  getAvailableModules,
  getModuleById,
  isKnownModule,
  activateModules,
} from './registry'
import { logger } from '@/socle/logger'
import { registerAdminNav } from '@/socle-plus/admin'
import { declarePermissions } from '@/socle-plus/authorization'

const PLATFORM_MODULE_IDS = ['seo', 'cms', 'blog', 'forms', 'media', 'user-profile']

describe('registry — known modules', () => {
  it('exposes all 6 platform modules', () => {
    expect(availableModules).toHaveLength(PLATFORM_MODULE_IDS.length)
    for (const id of PLATFORM_MODULE_IDS) {
      expect(availableModules.some((m) => m.id === id)).toBe(true)
    }
  })

  it('every module has a stable shape', () => {
    for (const m of availableModules) {
      expect(typeof m.id).toBe('string')
      expect(typeof m.name).toBe('string')
      expect(typeof m.description).toBe('string')
      expect(['available', 'planned', 'disabled']).toContain(m.status)
      expect(typeof m.version).toBe('string')
    }
  })

  it('seo is available with version >= 1.0.0', () => {
    const seo = getModuleById('seo')
    expect(seo?.status).toBe('available')
    expect(seo?.version).toBe('1.0.0')
  })

  it('media is available with version >= 1.0.0', () => {
    const media = getModuleById('media')
    expect(media?.status).toBe('available')
    expect(media?.version).toBe('1.0.0')
  })

  it('cms is available with version >= 1.0.0', () => {
    const cms = getModuleById('cms')
    expect(cms?.status).toBe('available')
    expect(cms?.version).toBe('1.0.0')
  })

  it('the remaining stub modules are still planned in V1', () => {
    const stillPlanned = ['blog', 'forms', 'user-profile']
    for (const id of stillPlanned) {
      expect(getModuleById(id)?.status).toBe('planned')
    }
  })

  it('seo declares migrations, adminNav and permissions', () => {
    const seo = getModuleById('seo')
    expect(seo?.hasMigrations).toBe(true)
    expect(seo?.adminNav?.length).toBeGreaterThan(0)
    expect(seo?.permissions?.length).toBeGreaterThan(0)
  })

  it('media declares migrations, adminNav and permissions', () => {
    const media = getModuleById('media')
    expect(media?.hasMigrations).toBe(true)
    expect(media?.adminNav?.length).toBeGreaterThan(0)
    expect(media?.permissions?.length).toBeGreaterThan(0)
  })

  it('module ids are unique', () => {
    const ids = availableModules.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('registry — accessors', () => {
  it('getAvailableModules returns the same reference as the named export', () => {
    expect(getAvailableModules()).toBe(availableModules)
  })

  it('getModuleById returns the matching module', () => {
    const seo = getModuleById('seo')
    expect(seo).toBeDefined()
    expect(seo?.id).toBe('seo')
    expect(seo?.name).toBe('SEO')
  })

  it('getModuleById returns undefined for an unknown id', () => {
    expect(getModuleById('does-not-exist')).toBeUndefined()
  })

  it('isKnownModule detects platform ids', () => {
    expect(isKnownModule('seo')).toBe(true)
    expect(isKnownModule('blog')).toBe(true)
    expect(isKnownModule('typo-here')).toBe(false)
  })
})

describe('activateModules — empty input', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty report for an empty list', () => {
    const report = activateModules([])
    expect(report.activated).toEqual([])
    expect(report.skipped).toEqual([])
    expect(report.unknown).toEqual([])
  })

  it('does not log anything for an empty list', () => {
    activateModules([])
    expect(vi.mocked(logger.info)).not.toHaveBeenCalled()
    expect(vi.mocked(logger.warn)).not.toHaveBeenCalled()
  })
})

describe('activateModules — planned modules (skipped)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips a planned module and reports it as such', () => {
    const report = activateModules(['blog'])
    expect(report.activated).toEqual([])
    expect(report.skipped).toEqual([{ id: 'blog', reason: 'planned' }])
    expect(report.unknown).toEqual([])
  })

  it('logs an info message for the skipped planned module', () => {
    activateModules(['blog'])
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      expect.stringMatching(/blog skipped — status: planned/),
    )
  })

  it('skips multiple planned modules in one call', () => {
    const report = activateModules(['blog', 'forms', 'user-profile'])
    expect(report.skipped.map((s) => s.id)).toEqual(['blog', 'forms', 'user-profile'])
    expect(report.activated).toEqual([])
  })

  it('does not call register-side helpers for planned modules', () => {
    activateModules(['blog', 'forms'])
    expect(vi.mocked(registerAdminNav)).not.toHaveBeenCalled()
    expect(vi.mocked(declarePermissions)).not.toHaveBeenCalled()
  })
})

describe('activateModules — unknown ids', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records unknown ids and warns', () => {
    const report = activateModules(['definitely-not-a-module'])
    expect(report.unknown).toEqual(['definitely-not-a-module'])
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      expect.stringMatching(/unknown id/),
      expect.objectContaining({ id: 'definitely-not-a-module' }),
    )
  })

  it('does not throw when given an unknown id', () => {
    expect(() => activateModules(['nope'])).not.toThrow()
  })

  it('mixes known and unknown ids cleanly', () => {
    const report = activateModules(['blog', 'unknown-x'])
    expect(report.skipped).toEqual([{ id: 'blog', reason: 'planned' }])
    expect(report.unknown).toEqual(['unknown-x'])
  })
})

describe('activateModules — available modules (seo)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('activates seo and reports it', () => {
    const report = activateModules(['seo'])
    expect(report.activated).toEqual(['seo'])
    expect(report.skipped).toEqual([])
    expect(report.unknown).toEqual([])
  })

  it('logs the activation with module version', () => {
    activateModules(['seo'])
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
      expect.stringMatching(/activated: seo \(1\.0\.0\)/),
    )
  })

  it('runs registerAdminNav for the seo nav entry', () => {
    activateModules(['seo'])
    expect(vi.mocked(registerAdminNav)).toHaveBeenCalledWith(
      expect.objectContaining({ href: '/admin/seo', requiredRole: 'admin' }),
    )
  })

  it('runs declarePermissions for the seo resource', () => {
    activateModules(['seo'])
    expect(vi.mocked(declarePermissions)).toHaveBeenCalledWith(
      'seo-page-meta',
      expect.objectContaining({ admin: expect.any(Array), super_admin: expect.any(Array) }),
    )
  })

  it('mixes available + planned + unknown in a single call', () => {
    const report = activateModules(['seo', 'blog', 'unknown-x'])
    expect(report.activated).toEqual(['seo'])
    expect(report.skipped).toEqual([{ id: 'blog', reason: 'planned' }])
    expect(report.unknown).toEqual(['unknown-x'])
  })
})
