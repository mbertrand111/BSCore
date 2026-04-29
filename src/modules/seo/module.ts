import { registerAdminNav } from '@/socle-plus/admin'
import { declarePermissions } from '@/socle-plus/authorization'
import type {
  ModuleAdminNavEntry,
  ModuleDefinition,
  ModulePermissionDeclaration,
} from '../types'

/**
 * SEO module — extends the Socle SEO baseline with per-page editable
 * metadata, a dynamic sitemap, structured data, and OG image generation.
 *
 * V1 of this module ships:
 *   - Admin section under /admin/seo for managing per-page metadata.
 *   - One RBAC resource: seo-page-meta.
 *   - Migrations under src/modules/seo/data/migrations/ (added in a
 *     follow-up — `hasMigrations: true` is metadata for discovery).
 *
 * The Socle baseline (robots.txt, sitemap.xml stub, metadataBase, OG
 * fallback) is NEVER weakened by this module — it only extends.
 */

const ADMIN_NAV: ReadonlyArray<ModuleAdminNavEntry> = [
  {
    label: 'SEO',
    href: '/admin/seo',
    requiredRole: 'admin',
    icon: '🔍',
  },
]

const PERMISSIONS: ReadonlyArray<ModulePermissionDeclaration> = [
  {
    resource: 'seo-page-meta',
    description: 'Per-page SEO metadata: title, description, OG, canonical, robots.',
  },
]

export const seoModule: ModuleDefinition = {
  id: 'seo',
  name: 'SEO',
  description:
    'Per-page SEO metadata, dynamic sitemap, structured data (JSON-LD), OG image generation, hreflang. Extends the Socle SEO baseline.',
  status: 'available',
  version: '1.0.0',
  hasMigrations: true,
  adminNav: ADMIN_NAV,
  permissions: PERMISSIONS,

  /**
   * Wires the module into the admin shell + RBAC engine. Both Socle+ helpers
   * are idempotent, so calling register more than once is safe.
   */
  register(): void {
    for (const entry of ADMIN_NAV) {
      registerAdminNav(entry)
    }
    declarePermissions('seo-page-meta', {
      admin: ['read', 'update'],
      super_admin: ['manage'],
    })
  },
}
