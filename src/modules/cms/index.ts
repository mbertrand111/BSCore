/**
 * Public interface of the CMS module.
 *
 * Other modules / app pages import only what's exported here. Internal
 * surfaces (server actions, components, raw repository CRUD) stay private.
 */

export { cmsModule } from './module'

// Public read helpers — used by the public route and any future module
// that needs to enumerate published pages (e.g. dynamic sitemap V2).
export {
  getPublishedCmsPageBySlug,
  listPublishedCmsPages,
} from './data/repository'
export type { CmsPage } from './data/repository'

// Type exports
export type { CmsStatus } from './constants'

// Slug introspection — useful for any caller that needs to pre-check
// a slug before showing a "page does not exist" UI (e.g. a 404 template
// that suggests CMS pages with similar slugs).
export { isReservedSlug, normalizeSlug } from './domain/slug'
