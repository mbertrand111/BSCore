import { logger } from '@/socle/logger'
import { seoModule } from './seo/module'
import { mediaModule } from './media/module'
import { cmsModule } from './cms/module'
import type { ActivationReport, ModuleDefinition } from './types'

/**
 * Registry of every module the platform knows about.
 *
 * Adding a module to this list does NOT activate it — projects opt in via
 * `enabledModuleIds` in `src/client/config/modules.config.ts`. Even then,
 * only modules with status === 'available' actually run their `register`
 * hook. 'planned' / 'disabled' modules are logged and skipped, so a project
 * can pre-declare its intent for a module before that module ships.
 *
 * When a module is implemented:
 *   1. Move its definition into `src/modules/[id]/module.ts` (exporting a
 *      ModuleDefinition with status 'available' and a register hook).
 *   2. Replace the inline stub here with `import { module } from './[id]/module'`
 *      and put it in MODULES.
 *
 * Until then, the inline stubs below are enough for the registry contract
 * to work end-to-end.
 */
const MODULES: ReadonlyArray<ModuleDefinition> = [
  seoModule,
  cmsModule,
  {
    id: 'blog',
    name: 'Blog',
    description: 'Posts, categories, authors, RSS feed, pagination.',
    status: 'planned',
    version: '0.0.0',
  },
  {
    id: 'forms',
    name: 'Forms',
    description: 'Form builder with submissions storage and email notifications.',
    status: 'planned',
    version: '0.0.0',
  },
  mediaModule,
  {
    id: 'user-profile',
    name: 'User Profile',
    description: 'Extended user attributes (name, avatar, contact fields, preferences).',
    status: 'planned',
    version: '0.0.0',
  },
]

// ---------------------------------------------------------------------------
// Read-only accessors
// ---------------------------------------------------------------------------

export const availableModules: ReadonlyArray<ModuleDefinition> = MODULES

export function getAvailableModules(): ReadonlyArray<ModuleDefinition> {
  return MODULES
}

export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id)
}

export function isKnownModule(id: string): boolean {
  return MODULES.some((m) => m.id === id)
}

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/**
 * Resolve the list of enabled module ids against the registry and run each
 * 'available' module's `register` hook. Logs warnings for unknown ids and
 * info messages for planned/disabled skips.
 *
 * Idempotent at the registry level (no internal state). The side effects of
 * `register()` (e.g. registerAdminNav) are themselves idempotent in the
 * Socle+ side. Calling activateModules a second time with the same list is
 * therefore safe.
 *
 * Where to call this: from a project-side boot point that runs before the
 * first admin layout render — typically at module load of a file imported
 * by `src/app/layout.tsx`. Modules cannot import from `src/client/`, so the
 * call site lives outside the modules layer (in app or client).
 */
export function activateModules(enabledIds: ReadonlyArray<string>): ActivationReport {
  const activated: string[] = []
  const skipped: Array<{ id: string; reason: 'planned' | 'disabled' }> = []
  const unknown: string[] = []

  for (const id of enabledIds) {
    const mod = getModuleById(id)
    if (mod === undefined) {
      unknown.push(id)
      logger.warn('[modules] unknown id in enabledModuleIds — typo?', { id })
      continue
    }
    if (mod.status === 'planned' || mod.status === 'disabled') {
      skipped.push({ id, reason: mod.status })
      logger.info(`[modules] ${id} skipped — status: ${mod.status}`)
      continue
    }
    mod.register?.()
    activated.push(id)
    logger.info(`[modules] activated: ${id} (${mod.version})`)
  }

  return { activated, skipped, unknown }
}
