import { registerAdminNav } from '@/socle-plus/admin'
import { declarePermissions } from '@/socle-plus/authorization'
import type {
  ModuleAdminNavEntry,
  ModuleDefinition,
  ModulePermissionDeclaration,
} from '../types'

/**
 * Media module — V1 simple media library.
 *
 * Capabilities:
 *   - Upload images (jpeg / png / webp, ≤ 10 MB) to Supabase Storage
 *   - List uploaded assets in the admin
 *   - Edit alt text
 *   - Delete (hard delete: DB row + storage blob)
 *
 * Out of scope V1 (deferred):
 *   resize / crop / variants, CDN custom, tags / folders, bulk upload,
 *   advanced search, CMS integration, AI alt text, SVG / PDF support.
 *
 * Deployment requirements (BEFORE first upload):
 *   1. `npm run db:migrate` — applies migration 0006 (media_assets table)
 *   2. Supabase Storage: create a bucket named `media` with PUBLIC read
 *      access. Bucket name is centralized in
 *      src/modules/media/constants.ts.
 *   3. `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` set in env (the upload
 *      orchestrator uses the service key to bypass RLS — security
 *      boundary is the Server Action's auth check).
 */

const ADMIN_NAV: ReadonlyArray<ModuleAdminNavEntry> = [
  {
    label: 'Media',
    href: '/admin/media',
    requiredRole: 'admin',
    icon: '🖼️',
  },
]

const PERMISSIONS: ReadonlyArray<ModulePermissionDeclaration> = [
  {
    resource: 'media-asset',
    description: 'Uploaded media files: images, alt text, deletion.',
  },
]

export const mediaModule: ModuleDefinition = {
  id: 'media',
  name: 'Media',
  description: 'Upload, list, and manage media files (images) stored in Supabase Storage.',
  status: 'available',
  version: '1.0.0',
  hasMigrations: true,
  adminNav: ADMIN_NAV,
  permissions: PERMISSIONS,

  /**
   * Wires the module into the admin shell + RBAC engine. Both Socle+
   * helpers are idempotent; safe to call more than once.
   */
  register(): void {
    for (const entry of ADMIN_NAV) {
      registerAdminNav(entry)
    }
    declarePermissions('media-asset', {
      admin: ['read', 'create', 'update', 'delete'],
      super_admin: ['manage'],
    })
  },
}
