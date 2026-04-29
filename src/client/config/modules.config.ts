/**
 * Modules enabled for THIS project.
 *
 * BSCore (this repository) is the platform core, not a specific client —
 * so the default list is empty. Each client clone opts in to the modules
 * it needs by appending ids here.
 *
 *   // Example for a client that uses SEO + CMS:
 *   export const enabledModuleIds: ReadonlyArray<string> = ['seo', 'cms']
 *
 * Behavior at activation (`activateModules` from `@/modules/registry`):
 *   - 'available' modules in this list run their `register` hook.
 *   - 'planned' / 'disabled' modules in this list are logged and skipped —
 *     the entry is preserved so activation fires automatically when the
 *     module ships, with no config change.
 *   - Unknown ids are warned (typo guard).
 *
 * See:
 *   - `src/modules/registry.ts` — what's available platform-side
 *   - `docs/MODULES.md` — module catalog and ownership
 *   - `/dev/modules` — runtime view of available + enabled modules
 */
// All available modules enabled — used to exercise the full UI on this
// core repo (no real client). Reset to `[]` before treating this repo
// as the canonical platform core again.
export const enabledModuleIds: ReadonlyArray<string> = ['seo', 'media', 'cms']

export type EnabledModuleId = (typeof enabledModuleIds)[number]
