import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '@/socle/config/env'
import { STORAGE_BUCKET } from '../constants'

/**
 * Supabase Storage helper for the media module.
 *
 * Uses the SERVICE_KEY (server-side only) so uploads bypass RLS. The
 * security boundary is the calling Server Action — it MUST validate auth
 * and role before reaching this layer. Never expose this client outside
 * server contexts (`'server-only'` enforces that statically).
 *
 * Bucket: `media` — must exist with public read access (created once via
 * the Supabase dashboard, see migration 0006 deployment notes).
 */

let _client: SupabaseClient | undefined

function getServiceClient(): SupabaseClient {
  if (_client !== undefined) return _client

  const url = getEnv('SUPABASE_URL')
  const serviceKey = getEnv('SUPABASE_SERVICE_KEY')
  if (url === undefined || url === '' || serviceKey === undefined || serviceKey === '') {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_KEY are required for media uploads. ' +
        'Set them in the deployment environment.',
    )
  }

  _client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _client
}

export interface UploadInput {
  storagePath: string
  contentType: string
  body: ArrayBuffer | Uint8Array | Blob
}

export async function uploadToStorage(input: UploadInput): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(input.storagePath, input.body, {
      contentType: input.contentType,
      cacheControl: '31536000', // 1 year — content addressed by uuid path
      upsert: false,
    })
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }
}

/**
 * Best-effort delete. Returns true on success, false on failure.
 * Caller decides whether to throw or to log and continue.
 */
export async function deleteFromStorage(storagePath: string): Promise<boolean> {
  const supabase = getServiceClient()
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
  return error === null
}

/**
 * Health-check helper: probes whether the Supabase Storage bucket used
 * by this module is reachable and exists. Returns a structured result
 * rather than throwing — designed to be wrapped by `domain/health.ts`
 * into a `HealthCheck`.
 *
 * Detects:
 *   - missing env (SUPABASE_URL / SUPABASE_SERVICE_KEY)
 *   - missing bucket (`media` not yet created in the Supabase project)
 *   - network / API errors (Supabase outage)
 */
export async function isStorageBucketReady(): Promise<{
  readonly ok: boolean
  readonly reason?: string
}> {
  const url = getEnv('SUPABASE_URL')
  const serviceKey = getEnv('SUPABASE_SERVICE_KEY')
  if (url === undefined || url === '' || serviceKey === undefined || serviceKey === '') {
    return { ok: false, reason: 'SUPABASE_URL or SUPABASE_SERVICE_KEY not set' }
  }

  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET)
    if (error) return { ok: false, reason: error.message }
    if (!data) return { ok: false, reason: `bucket "${STORAGE_BUCKET}" not found` }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Unknown storage error',
    }
  }
}

/**
 * Build the public URL for a stored object. Returns an empty string when
 * SUPABASE_URL is not configured — useful for dev / Socle-only contexts.
 *
 * Internal helper used by mapRow and the canonical `getMediaPublicUrl`
 * accessor below. Other callers should prefer `getMediaPublicUrl(asset)`
 * so the API stays asset-typed and call sites uniform.
 */
export function getStoragePublicUrl(storagePath: string): string {
  const url = getEnv('SUPABASE_URL')
  if (url === undefined || url === '') return ''
  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`
}

/**
 * Canonical public-URL accessor for a media asset.
 *
 * Use this from any code that has a MediaAsset (or any object exposing
 * `storagePath`). Avoid calling `asset.publicUrl` directly — that field
 * is a pre-computed convenience that may go away in V2 when:
 *   - private buckets + signed URLs (time-limited, must be regenerated)
 *   - CDN routing (URL depends on context)
 *   - per-environment URL overrides
 * are introduced. Centralizing on this helper keeps the migration to V2
 * a one-file change instead of a search-and-replace across consumers.
 */
export function getMediaPublicUrl(asset: { readonly storagePath: string }): string {
  return getStoragePublicUrl(asset.storagePath)
}

/** Reset the cached client. Test-only. */
export function _resetStorageClient(): void {
  _client = undefined
}
