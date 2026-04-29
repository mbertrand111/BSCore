# Module CMS — V1

Simple page management for the admin shell. Pages are stored in the application database; published pages are exposed at `/[slug]` via a dynamic public route.

---

## Role

Provide a minimal entry point for admins to author content pages without leaving the platform. Each page has a stable URL via its slug, a draft / published lifecycle, and integrates with the SEO and Media modules for richer rendering.

V1 is intentionally minimal: plain-text content, no block editor, no versioning. The contract is "publish a page at `/about`, see it live", nothing more.

---

## V1 capabilities

| Surface | Behavior |
|---|---|
| `/admin/cms` | List all CMS pages (DataTable: title, slug, status, last update, last publish, edit link) |
| `/admin/cms/new` | Form to create a page (title, slug, excerpt, content, status, optional main image) |
| `/admin/cms/[id]` | Edit form + delete (Danger zone, with native confirm) |
| `/[slug]` | Public dynamic route — renders the page if published, else `notFound()` |
| `getPublishedCmsPageBySlug(slug)` | Public helper for any consumer needing to read a published page |
| `listPublishedCmsPages()` | Public helper for enumerating published pages (V2 sitemap, RSS…) |
| `isReservedSlug(slug)` | Public helper to pre-check slug availability |

---

## Deployment requirements

1. **Migration applied** — `npm run db:migrate` runs `20260429_0007_create_cms_pages.ts`. The migration creates the table with a unique index on `slug`, a CHECK constraint on `status`, and a FK to `media_assets(id)` ON DELETE SET NULL.
2. **Media module table present** — the migration runner auto-discovers and applies migrations from every module folder regardless of `enabledModuleIds`. Migration 0006 (Media) sorts before 0007 (CMS), so the FK target table always exists. No additional setup needed.

No Storage bucket required (CMS does not write to Storage; it only references Media assets by id).

---

## Permissions

Declared in `cmsModule.register()`:

| Resource | `admin` | `super_admin` |
|---|---|---|
| `cms-page` | `read`, `create`, `update`, `delete` | `manage` |

Publish / unpublish is part of the `update` action — it's a status field change, not a separate RBAC verb. If a future workflow needs editor-only authors who cannot publish, add a `publish` action then.

All Server Actions call `requireAdminAuth()` first → role `admin` or `super_admin` is required to reach any CMS operation. There is **no public write endpoint**. The only public surface is the read-only `/[slug]` route.

---

## Data model

Table `cms_pages` (migration 0007):

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `title` | VARCHAR(200) | Required |
| `slug` | VARCHAR(100) UNIQUE | Lowercase, ASCII letters/digits/hyphens, not reserved |
| `excerpt` | VARCHAR(500) NULL | Short summary for SEO + lists |
| `content` | TEXT NOT NULL | Plain text, line-break preserved at render |
| `status` | VARCHAR(20) | CHECK IN ('draft', 'published'), DEFAULT 'draft' |
| `main_media_asset_id` | UUID NULL | FK to `media_assets(id)` ON DELETE SET NULL |
| `created_by` | UUID NOT NULL | Supabase Auth user id of the author. **No FK** (audit-style, mirrors other modules). |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | DEFAULT now(); refreshed on every update |
| `published_at` | TIMESTAMPTZ NULL | Set on first publish; preserved on republish or unpublish |

Indexes: unique on `slug`, plain on `status`, descending on `published_at`.

### `published_at` rules

- **Create** with `status='published'`: `publishedAt = now()`.
- **Update** transitioning `draft → published`: `publishedAt = now()` (first publish, or after a republish).
- **Update** within published (already published, content edit only): `publishedAt` is **left alone** — it represents the FIRST publish, not the LAST edit.
- **Update** transitioning `published → draft` (unpublish): `publishedAt` is **left alone** — preserves the history of when the page was last visible.

Implementation: `updateCmsPage(id, input, previousStatus)` — the action loads the existing page first to know `previousStatus`.

### `created_by` without FK

Same rationale as the Media module: a CMS page must survive the deletion of its author. The column is a marker, not a relation. Joins to `auth.users` are not the access pattern.

---

## Slug strategy

V1 expects an **explicit slug from the form** — no auto-generation from the title. This avoids the "title changed but slug didn't" trap and keeps the URL stable from creation.

Rules (Zod-validated):

| Rule | Enforcement |
|---|---|
| Required, 1-100 characters | `min(1)` / `max(100)` |
| Lowercase | `transform(normalizeSlug)` lowercases input automatically |
| ASCII letters, digits, hyphens only | `regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)` |
| No leading or trailing hyphen | Same regex |
| Not reserved | `refine(!isReservedSlug)` — list in `constants.ts::RESERVED_SLUGS` |

**Reserved slugs** mirror the platform's owned URL namespace:
- Platform: `admin`, `api`, `dev`, `login`, `_next`, `_app`, `_error`, `_document`, `static`, `public`, `assets`
- Metadata routes: `robots.txt`, `sitemap.xml`, `favicon.ico`, `manifest.webmanifest`
- Other module top-level routes (whether enabled or not): `media`, `seo`, `blog`, `cms`, `forms`

**Belt-and-suspenders:** the public route `/[slug]` calls `isReservedSlug(slug)` and returns `notFound()` if reserved, even if a row somehow snuck in with a reserved slug. Static routes (`/admin`, `/api`, etc.) take precedence over `/[slug]` in Next.js routing anyway, so the check is the third layer of defense.

**Slug uniqueness** is enforced at three layers: Zod (no), the action (pre-check via `getCmsPageBySlug`), and the unique index. The action's pre-check provides a clear inline error before the DB constraint fires.

---

## Content strategy

V1 stores **plain text** in the `content` TEXT column. Rendering on the public route uses `whitespace-pre-wrap` so line breaks are preserved.

**Why not a block editor / Markdown / rich HTML in V1:**
- A block editor is a sprawling concern (TipTap is integrated for the design system but consuming its HTML output safely requires a sanitization layer not yet in the project).
- Markdown rendering needs a library (`marked`, `remark`…) and a XSS-aware sanitizer.
- Plain text + `whitespace-pre-wrap` is safe by default and ships V1 today.

The trade-off (no inline formatting in published pages) is documented in V1 limits and the V2 leads. When demand for formatting arrives, V2 picks one of: Markdown via `marked` + `DOMPurify`, or TipTap HTML output + `DOMPurify`.

---

## SEO integration

Every public CMS page calls `generateMetadata` which delegates to the SEO module's `getSeoMetadata` helper:

```ts
// /[slug]/page.tsx
export async function generateMetadata({ params }) {
  const { slug } = await params
  const page = await getPublishedCmsPageBySlug(slug)
  if (page === null) return {}
  // … resolve main image URL via Media module …
  return getSeoMetadata(`/${page.slug}`, {
    title: page.title,
    description: page.excerpt ?? undefined,
    ogImageUrl,
  })
}
```

Resolution order (deterministic, per `docs/SEO_RULES.md`):

1. **SEO entry** for `/${slug}` if one exists in `seo_entries` — admins can override per-page metadata
2. **CMS page fields** as fallback — title, excerpt, main image
3. **Socle baseline** — `metadataBase`, default site name, OG fallback

This means: a CMS page is SEO-correct out of the box (uses its title + excerpt + image), and admins can fine-tune any page by adding a row in `/admin/seo`.

---

## Media integration

The CMS form lets admins pick an existing media asset as the page's main image. The picker is a simple `<Select>` populated server-side from `listMediaAssets()`. The selected `mainMediaAssetId` is a nullable FK to `media_assets(id)`.

If the linked media is deleted, the FK's `ON DELETE SET NULL` clears the reference but leaves the page intact (it just loses its main image). Documented in the page's "Danger zone" copy.

V1 limits: no upload-from-form, no media browser modal, no per-page Storage. To upload a new image, the admin goes to `/admin/media`, uploads it, then comes back to the CMS form and picks it from the dropdown. Acceptable for V1.

---

## Audit log strategy

Every CMS action emits one or more `AUDIT_EVENTS.ADMIN_ACTION` entries via `writeAuditEvent` (best-effort, never throws — same contract as the other modules):

| Action | Emitted events |
|---|---|
| Create page (status='draft') | `cms.page.created` |
| Create page (status='published') | `cms.page.created`, `cms.page.published` |
| Update page (no status change) | `cms.page.updated` |
| Update page (`draft → published`) | `cms.page.updated`, `cms.page.published` |
| Update page (`published → draft`) | `cms.page.updated`, `cms.page.unpublished` |
| Delete page | `cms.page.deleted` |

Meta fields logged: `id`, `slug`, `status`. **Page content is never logged** — it can be large, and full content has no use in audit (the row is the source of truth).

---

## V1 limits — explicit

| Limit | Value |
|---|---|
| Title length | 200 |
| Slug length | 100 |
| Excerpt length | 500 |
| Content length | 50,000 chars |
| Format | Plain text only (no Markdown rendering) |
| Status values | `draft`, `published` |
| Auto-generation of slug from title | Not supported |
| Slug change after publish | Allowed — old slug returns 404, new slug serves the page |
| Versioning / history | Not stored |
| Scheduled publishing | Not supported |
| Multi-language | Not supported |
| Media picker | Plain `<Select>` of all media assets |
| Search / tags / categories | Not supported |
| Preview | "Save as draft" + visit URL while logged out is the V1 preview |

Performance note: the media picker fetches **all** media assets server-side on every form load. For a small library this is fine; with hundreds of assets, consider pagination or a search picker (V2).

---

## V2 leads (not implemented)

- **Markdown / sanitized HTML rendering** — pick `marked` + `DOMPurify` or TipTap output + `DOMPurify`. Update `/[slug]` rendering to use the chosen path.
- **Block editor** — full WYSIWYG with embedded media. Substantial work; needs the rendering story first.
- **Versioning + revisions** — separate `cms_page_revisions` table; admin diff/restore UI.
- **Scheduled publishing** — `publishAt` column + a worker that flips `status` at the right time.
- **Multi-language** — `cms_page_translations` table, `hreflang` integration with the SEO module.
- **Dynamic sitemap** — replace the baseline single-entry sitemap with `listPublishedCmsPages()` output, per-page `lastModified`.
- **Search / tags / categories** — adds related tables and an admin index page.
- **Preview workflow** — sharable preview URL for drafts (signed token).
- **Media picker modal** — a real picker with search, paginated grid, upload-from-form.

Each is a separable change and none requires reshaping V1.

---

## Pointer to source

| Concern | File |
|---|---|
| Module declaration | `src/modules/cms/module.ts` |
| Public exports | `src/modules/cms/index.ts` |
| Constants (limits, reserved slugs) | `src/modules/cms/constants.ts` |
| Slug helpers | `src/modules/cms/domain/slug.ts` |
| Zod schemas | `src/modules/cms/domain/schemas.ts` |
| DB schema | `src/modules/cms/data/schema.ts` |
| Migration | `src/modules/cms/data/migrations/20260429_0007_create_cms_pages.ts` |
| Repository | `src/modules/cms/data/repository.ts` |
| Server Actions | `src/modules/cms/admin/actions.ts` |
| Form state | `src/modules/cms/admin/state.ts` |
| Client form components | `src/modules/cms/components/` |
| Admin pages | `src/app/admin/cms/` |
| Public route | `src/app/(public)/[slug]/page.tsx` |
