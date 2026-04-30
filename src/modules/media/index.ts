/**
 * Public interface of the Media module.
 *
 * Other modules / app pages import only what's exported here. Internal
 * surfaces (repository implementations, server actions, Supabase storage
 * client) stay private.
 */

export { mediaModule } from './module'

// Read-only public types + accessors for consumers that need to resolve a
// media id to its full asset shape (e.g. the CMS public route showing a
// page's main image, the sandbox loading the photographer's hero asset).
export { getMediaAssetById } from './data/repository'
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
