# BSCore — Project State

State-of-the-core snapshot. Updated when modules land, when the architecture shifts, or when a major decision is taken. Concise on purpose: each section points to the authoritative doc for full detail.

**Last updated:** 2026-04-29 — after CMS V1 (page CRUD, draft/published lifecycle, public `/[slug]` route, SEO + Media integration, `docs/modules/CMS.md`).

---

## 📦 Modules

| ID | Status | Version | Notes |
|---|---|---|---|
| `seo` | ✅ available | 1.0.0 | Per-route metadata, admin CRUD, `getSeoMetadata()` helper. See `docs/SEO_RULES.md` § "Module SEO V1". |
| `media` | ✅ available | 1.0.0 | Image upload + metadata + admin CRUD. See `docs/modules/MEDIA.md`. |
| `cms` | ✅ available | 1.0.0 | Page CRUD, draft/published lifecycle, public `/[slug]` route, SEO+Media-aware. See `docs/modules/CMS.md`. |
| `blog` | 🟡 planned | — | Posts, categories, RSS. |
| `forms` | 🟡 planned | — | Form builder, submissions. |
| `user-profile` | 🟡 planned | — | Extended user attributes. |

**Activation:** none enabled on this core repo (`enabledModuleIds: ReadonlyArray<string> = []` in `src/client/config/modules.config.ts`). Each client clone opts in. Live module state is visible at `/dev/modules` in dev.

---

## 🧱 Architecture

Four layers, dependency runs **downward only**.

| Layer | Owns | Source |
|---|---|---|
| **Socle** | Routing, errors, logger, security baseline (headers, robots, sitemap), config, Next.js adapter, SEO baseline | `src/socle/`, `src/app/{robots,sitemap,layout}.{ts,tsx}` |
| **Socle+** | DB (Drizzle + Supabase), auth (Supabase Auth + cookies), RBAC (`can`, `requireRole`), admin shell, audit log | `src/socle-plus/` |
| **Modules** | Domain features (SEO, Media, …). Activate via the registry. | `src/modules/[id]/` |
| **Client** | Project-specific config, branding, page content, module activation list | `src/client/` |

Full rules: `docs/ARCHITECTURE.md`, `docs/BOUNDARIES.md`.

---

## ⚙️ Stack

- **Next.js 15** App Router, Server Components default, Edge middleware for cookies + security headers
- **TypeScript** strict + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`
- **Supabase** Auth (sessions, JWT) + Storage (media bucket)
- **Drizzle ORM** + `postgres-js` driver, lazy proxy db-client, file-based migration runner
- **Tailwind CSS** + design tokens via CSS vars + Radix primitives (Dialog, Select, Checkbox, Dropdown, Tooltip, Tabs, Accordion, Avatar, Toast)
- **Zod** for input validation everywhere
- **Vitest** for unit/integration tests, **Playwright** for E2E
- **lucide-react** for icons, **TipTap** (StarterKit) for the rich text editor

Full reference: `docs/TECH_STACK.md`, `docs/ADR/0001-tech-stack.md`, `docs/ADR/0002-orm-choice.md`.

---

## 🔐 Security

| Concern | Status |
|---|---|
| Auth | Centralized via `requireAdminAuth()` (Socle+ admin) — used in `src/app/admin/layout.tsx` AND in every module's Server Actions. Defense in depth. |
| Session validation | `supabase.auth.getUser()` everywhere — never `getSession()` (validates JWT against Supabase). |
| RBAC | `declarePermissions(resource, role-actions)` at module activation; `can(user, action, resource)` at use site. |
| Fail-secure | A user without a `user_roles` row is treated as unauthenticated. No default role. |
| Audit log | `writeAuditEvent()` is **best-effort** (catches own DB failures, never throws). All admin actions emit `AUDIT_EVENTS.ADMIN_ACTION` entries. |
| Input validation | Zod at every Server Action boundary. Schemas live in `src/modules/[id]/domain/schemas.ts`. |
| Secrets | `process.env` reads happen ONLY in `src/socle/config/env.ts` (verified by grep). |
| Edge middleware | Limited to cookie refresh + security headers + request-id. **Never** runs DB queries. |
| Robots.txt | `/admin`, `/api`, `/dev`, `/login` disallowed at the baseline. |

Full rules: `docs/SECURITY_RULES.md`, `docs/RISKS.md`.

---

## 🌐 SEO

Two layers — both work together, neither weakens the other.

### Baseline (always shipped, no DB)

- `metadataBase` resolved from `NEXT_PUBLIC_APP_URL` (strict-prod: throws if missing/malformed in `NODE_ENV=production`)
- Title template `'%s | BSCore'`, default description, applicationName
- Open Graph + Twitter card fallback
- `/robots.txt` + `/sitemap.xml` (homepage entry only)
- `noindex` on `/login`, `/dev/*`, future private routes

### Module SEO V1 (when activated)

- Per-route metadata in `seo_entries` table
- Admin CRUD at `/admin/seo`, `/admin/seo/new`, `/admin/seo/[id]`
- Public helper `getSeoMetadata(route, fallback?)` for `generateMetadata()`
- Resolution order: SEO entry → fallback → baseline (deterministic, no implicit merge)
- Forbidden routes (rejected by Zod): `/admin*`, `/api*`, `/dev*`, `/login`

Full reference: `docs/SEO_RULES.md`.

---

## 🖼️ Media V1

Simple media library accessible via `/admin/media`. Admin-only, no public upload surface.

### What it does

- Upload images (jpeg / png / webp, ≤ 10 MB) to Supabase Storage bucket `media`
- Track metadata in `media_assets` (storage path, mime, size, alt text, uploader)
- List, edit alt text, delete (hard delete: DB-first, Storage best-effort)
- Public URL derived via canonical helper `getMediaPublicUrl(asset)`

### Deployment requirements (BEFORE first upload)

1. `npm run db:migrate` — applies migration 0006 (`media_assets` table)
2. Create the Supabase Storage bucket named `media` with **public read** access
3. `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` set in env

### Key technical choices

- **URL strategy** — centralized in `domain/storage.ts`; `getMediaPublicUrl(asset)` is the canonical accessor; `MediaAsset.publicUrl` is a derived convenience field that may go away in V2
- **Hard delete, DB-first** — orphan blobs accepted, cleanup is a V2 concern
- **`created_by` without FK** — survives uploader deletion (compliance, mirrors `audit_events.user_id`)
- **Audit log best-effort** — failed audit insert is logged but never breaks the action
- **No quota** — admin-only surface, abuse model is "rogue admin", acceptable for V1

### V1 limits

No image variants, no resize/crop, no CDN, no signed URLs, no tags/folders, no bulk upload, no SVG/PDF, no AI alt text. All tracked in `docs/modules/MEDIA.md` § "V2 leads".

Full reference: `docs/modules/MEDIA.md`.

---

## 🧩 Module registry

Source of truth: `src/modules/registry.ts`.

### Lifecycle

- `'planned'` → declared, no implementation. Pre-listing in `enabledModuleIds` is allowed; activation logs and skips. Future implementation flips to `'available'` and the activation fires automatically.
- `'available'` → implemented and ready. Activation runs the `register()` hook (registerAdminNav + declarePermissions).
- `'disabled'` → opt-out at platform level (not used in V1).

### Activation flow

`src/app/_boot.ts` (server-only, side-effect import in root layout) calls `activateModules(enabledModuleIds)` once per Node process. Idempotent — `registerAdminNav` dedupes by href, `declarePermissions` is additive.

### Per-project enablement

`src/client/config/modules.config.ts` — array of module ids. **Empty in this core repo.** Client clones append what they need:

```ts
export const enabledModuleIds: ReadonlyArray<string> = ['seo', 'media']
```

### Inspection

`/dev/modules` (dev-only, returns 404 in prod) renders the live registry: status counts, per-module cards with badges (enabled / available / planned / migrations / permissions / nav entries), and the activation procedure.

---

## 🚧 Global state

**Core is stable.** Architecture, registry, activation flow, audit log, RBAC, SEO baseline, design system, theming, E2E setup — all in place and validated by:

| Check | State |
|---|---|
| Lint | ✅ 0 warning |
| Typecheck | ✅ 0 error |
| Tests | ✅ 26 files, 464 tests |
| Build | ✅ 17 routes + Edge middleware, all dynamic / static categorized correctly |

**Module system validated end-to-end** by the SEO + Media + CMS implementations. The same scaffold works for any future domain module (`module.ts` declaring nav + permissions + register hook → registry → activation). All three modules have:
- migration auto-discovered by the runner
- admin nav appearing automatically when activated
- permissions declared and ready for `can(user, action, resource)`
- Server Actions enforcing `requireAdminAuth()` + Zod + audit logging
- their own dedicated module doc

**Ready for next module.** No architectural blockers, no debt to pay first.

---

## 🚀 Next steps

**Immediate next module candidates** — pick when product priority is set:

- **Blog** — sits on top of CMS naturally; shared content patterns. Likely next.
- **User Profile** — extends the user model (display name, avatar via Media module, contact fields).
- **Forms** — submission storage + email; useful for marketing sites.

**CMS V2 evolutions** (not new modules, separable from the next module work):

- Markdown / sanitized HTML rendering for richer page content
- Dynamic sitemap fed by `listPublishedCmsPages()`
- Versioning, scheduled publishing, multi-language

**Direction signals** noted from prior tasks (not commitments):

- A first **client project** would pin the next module — pick the one that unlocks the project's MVP.
- **E2E for SEO + Media** are deferred until Supabase + DB E2E env is wired (target tests already specified in `e2e/README.md` "Backlog" section).
- **OQ F-1** (Radix vs. Ariakit) and **OQ F-2** (Toast lib) listed in `docs/FRONTEND.md` are not blocking but may surface again at the first interactive form-heavy module.

No active V2 work on existing modules — both V1s are designed to coexist with their V2 evolutions without breaking the contract.
