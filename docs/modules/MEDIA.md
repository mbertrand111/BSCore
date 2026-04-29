# Module Media — V1

Simple media library for the admin shell. Stores image files in Supabase Storage; tracks metadata (size, mime, alt text, uploader) in the application database.

---

## Role

Provide a minimal, secure entry point for admins to upload, list, edit alt text, and delete media files (images). The module is admin-only; there is no public upload surface.

It is the source of truth for media assets used by other modules (future CMS, Blog…) — those modules link to assets by `id` and read the public URL through the canonical helper.

---

## V1 capabilities

| Surface | Behavior |
|---|---|
| `/admin/media` | List of uploaded assets (DataTable: thumbnail, filename + alt, MIME, size, date, edit link) |
| `/admin/media/new` | File picker + alt text → upload via Server Action |
| `/admin/media/[id]` | Preview + metadata + edit alt text + delete (with confirm) |
| `getMediaPublicUrl(asset)` | Canonical helper to get a public URL for any asset (server-only) |

V1 stops there. Bulk upload, folders/tags, search, image variants, AI alt text, CDN, signed URLs are explicitly out of scope (see "V2 leads" below).

---

## Deployment requirements

Three things must be in place **before** the first upload:

1. **Migration applied** — `npm run db:migrate` runs `20260429_0006_create_media_assets.ts` and creates the `media_assets` table with its unique index on `storage_path`.
2. **Supabase Storage bucket** — a bucket named `media` must exist with **public read access**. Create it once via the Supabase dashboard or CLI. The bucket name is centralized in `src/modules/media/constants.ts` (`STORAGE_BUCKET`).
3. **Environment variables** — `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` must be set. The upload orchestrator uses the service key to bypass Storage RLS; the security boundary is the Server Action's `requireAdminAuth()` check.

Without any of the three: `/admin/media` 500s on the first upload (or list, if the table is missing).

---

## Permissions

Declared in `mediaModule.register()`:

| Resource | `admin` | `super_admin` |
|---|---|---|
| `media-asset` | `read`, `create`, `update`, `delete` | `manage` |

All Server Actions call `requireAdminAuth()` first → role `admin` or `super_admin` is required to reach any media operation. There is **no public endpoint**.

---

## Data model

Table `media_assets` (migration 0006):

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `storage_path` | VARCHAR(512) UNIQUE | Canonical key in the Supabase bucket |
| `original_filename` | VARCHAR(255) | Preserved from the upload, for display |
| `mime_type` | VARCHAR(100) | Validated against the allowlist |
| `size_bytes` | INTEGER | Validated against `MAX_SIZE_BYTES` |
| `alt_text` | VARCHAR(500) | Defaults to empty; editable post-upload |
| `created_by` | UUID | Supabase Auth user id of the uploader. **No FK** — see below. |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() |

Indexes: unique on `storage_path`, descending on `created_at` (admin list ordering).

### `created_by` without FK — accepted choice

The column is declared `NOT NULL` but has **no foreign key** to `auth.users(id)`. Reasoning, mirroring `audit_events.user_id`:

- A media asset must **survive the deletion of its uploader** (compliance: the trace of who uploaded what stays even if the user is removed).
- The field is a marker, not a relation. Joins to `auth.users` are not the access pattern (the admin UI doesn't show "uploader name"; if it did, the join would be made via Supabase auth API, not a DB FK).
- The Supabase `auth` schema isn't guaranteed to be present in plain-Postgres test environments — same constraint that drove RISK-001 in the platform RISKS register.

Consequence: orphan `created_by` UUIDs may exist after user deletion. They are inert.

---

## URL strategy

URLs are **not stored** in the database. Only `storage_path` lives there.

The canonical accessor is **`getMediaPublicUrl(asset)`**, exported from `@/modules/media`. It is the single API every consumer should use.

```ts
import { getMediaPublicUrl } from '@/modules/media'

const url = getMediaPublicUrl(asset)
// → 'https://<project>.supabase.co/storage/v1/object/public/media/<storagePath>'
```

The `MediaAsset` shape carries a pre-computed `publicUrl` field for convenience (used by the admin pages to render `<img src={asset.publicUrl}>`). **Treat that field as a derived shortcut.** V2 may remove it when signed URLs / CDN routing land — at that point every consumer that uses the helper continues to work; consumers that read the field directly will break.

Internally:
- `getMediaPublicUrl(asset)` calls `getStoragePublicUrl(asset.storagePath)`.
- `getStoragePublicUrl(path)` is the only place the URL string is constructed.

A grep for `/storage/v1/object/public/` returns matches only in `domain/storage.ts` (and its test) — confirming centralization.

---

## Deletion strategy

V1 uses **hard delete** with a deliberate two-step ordering:

1. **DB row deleted first.** The DB is the source of truth — once the row is gone, the asset is invisible from the admin shell and no other module can link to it. This is the moment the deletion is "real" from the user's perspective.
2. **Storage blob deleted second, best-effort.** If Supabase Storage is unreachable or the object is already gone, we log a warning (`[media] storage delete failed — orphan blob left behind`) and continue. The orphan blob is harmless: nothing references it.

**Why this order, not the reverse:**

| Order | Failure mode | Consequence |
|---|---|---|
| **DB → Storage (V1)** | Storage delete fails | Orphan blob = some wasted storage. UI is consistent. |
| Storage → DB | DB delete fails | Orphan row pointing to a missing file. UI is broken (404 image). |

DB-first is safer.

**Cleanup of orphan blobs** is intentionally not automated in V1. Operations team can (a) sweep the bucket manually, or (b) write a one-off script that lists Storage objects whose path is not in `media_assets.storage_path`. A scheduled cleanup job is a V2 concern.

---

## Audit log strategy

Every Media action emits an `AUDIT_EVENTS.ADMIN_ACTION` entry via `writeAuditEvent` from `@/socle-plus/audit`. The events:

| Action | `meta.action` | Extra fields |
|---|---|---|
| Upload | `media.asset.uploaded` | `id`, `mimeType`, `sizeBytes`, `originalFilename` |
| Edit alt text | `media.asset.alt_updated` | `id` |
| Delete | `media.asset.deleted` | `id`, `storagePath`, `storageDeleted` (boolean — did the blob delete succeed?) |

**Audit is best-effort, not blocking.** `writeAuditEvent` itself catches its own DB-write failures (cf. `audit-service.ts`) and logs them via `logger.error`; it never throws. Consequence: a failed audit insert is logged server-side but does **not** break the user-facing action. This contract is identical to the SEO module and the Socle+ baseline — every module in BSCore relies on the same fail-safe audit primitive.

---

## V1 limits — explicit

| Limit | Value |
|---|---|
| Max file size | 10 MB (`MAX_SIZE_BYTES` in `constants.ts`) |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Per-admin / per-project quotas | **None** |
| Versioning / history | None |
| Image processing (resize, crop, variants) | None |
| Storage strategy | Single public bucket, public URLs |
| Bulk upload | Not supported |
| Folders / tags / search | Not supported |

**No quota** is the deliberate accepted risk: the surface is admin-only (`requireAdminAuth`), so the abuse model is "rogue admin uploads many files" rather than "anonymous abuse". Acceptable for V1; revisit if BSCore becomes multi-tenant or admin onboarding loosens.

---

## V2 leads (not implemented)

Roadmap candidates, sorted roughly by likely demand:

- **Signed URLs / private bucket** — `getMediaPublicUrl` becomes async, takes options (TTL, intent), returns short-lived URLs. Pre-computed `publicUrl` field is removed.
- **Image variants** — automatic thumbnails / responsive sizes via Sharp or a Storage transform. Adds `variants` table or `variants_json` column.
- **Soft delete + restore** — adds `deleted_at` column; admin "trash" view; scheduled hard-delete after N days.
- **Storage cleanup job** — scheduled task that diffs bucket vs. table, removes orphan blobs.
- **CMS integration** — first-class media picker in the CMS module's content editor.
- **Per-project / per-org quotas** — when BSCore goes multi-tenant.
- **SVG / PDF support** — adds dedicated sanitization for SVG (XSS via inline scripts) and structured handling for PDFs.
- **Bulk upload** — drag-and-drop, multi-file with progress.
- **Tags / folders / search** — content organization at scale.
- **AI alt text** — auto-suggested descriptions on upload (CMS / Blog feature, not media-internal).

Each is a separable change; none requires reshaping V1.

---

## Pointer to source

| Concern | File |
|---|---|
| Module declaration | `src/modules/media/module.ts` |
| Public exports | `src/modules/media/index.ts` |
| Constants (limits, bucket) | `src/modules/media/constants.ts` |
| DB schema | `src/modules/media/data/schema.ts` |
| Migration | `src/modules/media/data/migrations/20260429_0006_create_media_assets.ts` |
| Repository | `src/modules/media/data/repository.ts` |
| Storage helpers (URL, upload, delete) | `src/modules/media/domain/storage.ts` |
| Upload orchestrator | `src/modules/media/domain/upload.ts` |
| Zod schemas | `src/modules/media/domain/schemas.ts` |
| Server Actions | `src/modules/media/admin/actions.ts` |
| Form state types | `src/modules/media/admin/state.ts` |
| Client form components | `src/modules/media/components/` |
| Admin pages | `src/app/admin/media/` |
