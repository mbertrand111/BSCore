/**
 * Public interface of the Media module.
 *
 * Other modules / app pages import only what's exported here. Internal
 * surfaces (repository implementations, server actions, Supabase storage
 * client) stay private.
 */

export { mediaModule } from './module'

// Read-only public types for consumers (e.g. a future CMS module that
// references uploaded media).
export type { MediaAsset } from './data/repository'

// Public-URL accessors. Prefer `getMediaPublicUrl(asset)` — it's the
// canonical API and stays stable across V2 changes (signed URLs, CDN…).
// `getStoragePublicUrl(path)` is exposed for the rare case where a caller
// has only a raw storage path (e.g. before the row is loaded).
export { getMediaPublicUrl, getStoragePublicUrl } from './domain/storage'

// Module constants — exposed so projects can read the limits they're
// running under (e.g. show "max X MB" in admin UI).
export { ALLOWED_MIME_TYPES, MAX_SIZE_BYTES } from './constants'

// Health checks — surfaced by /dev/modules and available for future
// integration into the global /api/health aggregator.
export { checkMediaDatabase, checkMediaStorage, runMediaChecks } from './domain/health'
