/**
 * Module contract — every module declares itself with this shape.
 *
 * Lifecycle:
 *   - 'planned'   : known to the platform, no implementation yet. Listed in
 *                   the registry so projects can pre-declare intent in
 *                   `enabledModuleIds`. Skipped at activation with a log.
 *   - 'available' : implemented and ready to activate. Activation runs the
 *                   `register` hook (if any) and surfaces the module to
 *                   admin / RBAC / migrations layers.
 *   - 'disabled'  : explicitly turned off at the platform level (e.g.
 *                   deprecated, security advisory). Skipped at activation.
 *
 * Boundaries:
 *   - The contract is descriptive. The actual side effects (registering
 *     admin nav entries, declaring RBAC permissions) happen inside the
 *     `register` hook, which the module owns.
 *   - Migrations live on the filesystem under
 *     `src/modules/[id]/data/migrations/` and are auto-discovered by the
 *     Socle+ migration runner. The `hasMigrations` field is metadata for
 *     tooling / discovery only — the runner does not read it.
 */

export type ModuleStatus = 'available' | 'planned' | 'disabled'

export interface ModuleAdminNavEntry {
  readonly label: string
  readonly href: string
  readonly requiredRole: 'admin' | 'super_admin'
  /** Optional decorative icon — passed through to AdminSidebar. */
  readonly icon?: string
}

export interface ModulePermissionDeclaration {
  /** Resource name as used in `can(user, action, resource)`. */
  readonly resource: string
  /** One-line description for documentation / admin discovery. */
  readonly description: string
}

export interface ModuleDefinition {
  /**
   * Stable, kebab-case identifier. Doubles as the directory name under
   * `src/modules/` and the prefix for module-owned migration filenames.
   */
  readonly id: string

  /** Human-readable name. Used in admin / dashboard surfaces. */
  readonly name: string

  /** One-line description. Surfaced in the module catalog UI. */
  readonly description: string

  /** Lifecycle status — see ModuleStatus. */
  readonly status: ModuleStatus

  /** Semver string. `'0.0.0'` for planned modules. */
  readonly version: string

  /** Optional declarative list of admin nav entries this module exposes. */
  readonly adminNav?: ReadonlyArray<ModuleAdminNavEntry>

  /** Optional declarative list of RBAC resources this module owns. */
  readonly permissions?: ReadonlyArray<ModulePermissionDeclaration>

  /**
   * Optional metadata flag — true if the module ships migrations under
   * `src/modules/[id]/data/migrations/`. Not consumed by the migration
   * runner (which scans the filesystem); informational only.
   */
  readonly hasMigrations?: boolean

  /**
   * Optional registration hook. Called once when the module is activated.
   * Use it to call `registerAdminNav()`, `declarePermissions()`, or any
   * other module-side wiring. Migrations are auto-discovered — do not
   * register them here.
   */
  readonly register?: () => void
}

/**
 * Result of `activateModules()` — useful for boot-time diagnostics and
 * admin "module status" surfaces.
 */
export interface ActivationReport {
  readonly activated: ReadonlyArray<string>
  readonly skipped: ReadonlyArray<{ readonly id: string; readonly reason: 'planned' | 'disabled' }>
  readonly unknown: ReadonlyArray<string>
}
