/**
 * Public interface of the SEO module.
 *
 * Other modules / app pages import only what's exported here. Internal
 * surfaces (repository, schema, server actions, components) stay private.
 */

// Module definition (consumed by the registry)
export { seoModule } from './module'

// Server-only metadata helper for `generateMetadata()`
export { getSeoEntry, getSeoMetadata } from './domain/metadata'
export type { MetadataFallback } from './domain/metadata'

// Public types (read-only consumers)
export type { SeoEntry } from './data/repository'
export type { SeoEntryInput } from './domain/schemas'
