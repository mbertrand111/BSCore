import 'server-only'

import { activateModules } from '@/modules/registry'
import { registerCoreNav } from '@/socle-plus/admin'
import { enabledModuleIds } from '@/client/config/modules.config'

/**
 * Server-side module activation, executed once at module load.
 *
 * Imported for its side effect from `src/app/layout.tsx`. Top-level statements
 * in JS modules run once per Node module instance, so:
 *   - in production: activation runs at server boot
 *   - in dev with HMR: may re-run on layout reload, but registerAdminNav and
 *     declarePermissions are idempotent (deduped by href / set-based merge),
 *     so duplicate calls are no-ops
 *
 * Order:
 *   1. Activate enabled modules — each runs its register() hook to publish
 *      its admin nav entries + RBAC permissions.
 *   2. Register Socle+ core nav (dashboard, users stub, settings stub).
 *      Order is irrelevant for the grouped sidebar output, but doing this
 *      after modules keeps the natural reading flow.
 *
 * `'server-only'` ensures this file cannot be pulled into a Client Component
 * tree by accident — module activation must never reach the browser bundle.
 */
activateModules(enabledModuleIds)
registerCoreNav()
