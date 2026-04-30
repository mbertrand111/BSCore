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

// Block layer — types + the public Server Component renderer used by the
// public route AND by client-specific surfaces (sandboxes, micro-sites)
// that want to honor the structured content of a page.
export type {
  Block,
  BlockType,
  HeroBlock,
  TextBlock,
  GalleryBlock,
  CtaBlock,
} from './domain/blocks'
export { BlockRenderer } from './components/blocks/BlockRenderer'
export type { BlockRendererProps } from './components/blocks/BlockRenderer'

// Slug introspection — useful for any caller that needs to pre-check
// a slug before showing a "page does not exist" UI (e.g. a 404 template
// that suggests CMS pages with similar slugs).
export { isReservedSlug, normalizeSlug } from './domain/slug'
