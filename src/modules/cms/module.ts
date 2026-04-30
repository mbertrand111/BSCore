import { registerAdminNav } from '@/socle-plus/admin'
import { declarePermissions } from '@/socle-plus/authorization'
import type {
  ModuleAdminNavEntry,
  ModuleDefinition,
  ModulePermissionDeclaration,
} from '../types'
import { countCmsPages } from './data/repository'

/**
 * CMS module — V1 simple page management.
 *
 * Capabilities:
 *   - Create / edit / delete CMS pages from the admin
 *   - Plain-text content with line-break preservation
 *   - Draft / published status with publishedAt tracking
 *   - Optional main image picked from the Media module
 *   - Public route `/[slug]` for published pages
 *   - SEO-aware: `generateMetadata` calls `getSeoMetadata` from the
 *     SEO module with the page's title/excerpt/main image as fallback
 *
 * Out of scope V1 (deferred):
 *   block editor, drag & drop, dynamic components, versioning,
 *   advanced preview, multi-language, scheduled publishing, dynamic
 *   sitemap, JSON-LD, search, tags, categories, complex media picker.
 *
 * Cross-module dependency:
 *   `cms_pages.main_media_asset_id` references `media_assets(id)` ON
 *   DELETE SET NULL. Both migrations are auto-discovered by the runner
 *   regardless of `enabledModuleIds`, so the FK target table always
 *   exists at deploy time.
 *
 * Deployment requirement:
 *   `npm run db:migrate` — applies migration 0007 (cms_pages table).
 */

const ADMIN_NAV: ReadonlyArray<ModuleAdminNavEntry> = [
  {
    label: 'Pages',
    href: '/admin/cms',
    requiredRole: 'admin',
    icon: 'file-text',
    section: 'content',
    count: countCmsPages,
  },
]

const PERMISSIONS: ReadonlyArray<ModulePermissionDeclaration> = [
  {
    resource: 'cms-page',
    description: 'CMS pages: title, slug, content, status (draft / published).',
  },
]

export const cmsModule: ModuleDefinition = {
  id: 'cms',
  name: 'CMS',
  description:
    'Page builder with title, slug, content, draft/published status, optional main image, and a public dynamic route.',
  status: 'available',
  version: '1.0.0',
  hasMigrations: true,
  adminNav: ADMIN_NAV,
  permissions: PERMISSIONS,

  /**
   * Wires the module into the admin shell + RBAC engine. Both Socle+
   * helpers are idempotent; safe to call more than once.
   *
   * Note: `publish` is part of `update` in V1 — a publish/unpublish is
   * a status field change, not a separate RBAC action. If a future
   * workflow requires the distinction (e.g. editor-only authors who
   * cannot publish), add a `publish` action then.
   */
  register(): void {
    for (const entry of ADMIN_NAV) {
      registerAdminNav(entry)
    }
    declarePermissions('cms-page', {
      admin: ['read', 'create', 'update', 'delete'],
      super_admin: ['manage'],
    })
  },
}
