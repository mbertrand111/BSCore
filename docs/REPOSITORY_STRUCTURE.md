# REPOSITORY STRUCTURE — BSCore

## 1. Overview

This document defines the physical folder structure of the BSCore repository. The structure is designed to enforce the architectural layers defined in `docs/ARCHITECTURE.md` and `docs/BOUNDARIES.md` through filesystem organization — not just convention.

**Framework assumption:** Next.js with the App Router and TypeScript. If the framework changes, the layer structure (Socle, Socle+, Modules, etc.) remains valid; only the `src/app/` directory conventions would adapt.

---

## 2. Repository Model

BSCore is a **clone-based platform**, not a monorepo.

- One clean base repository is maintained.
- Each client project is a clone or fork of that base.
- Client-specific code lives in `src/client/` and is never merged back into the base.
- Improvements to Socle, Socle+, or shared modules can be cherry-picked back to the base if they have no client-specific content.

This model means:
- No workspace tooling required.
- No cross-client coupling.
- The base repo is always in a clean, deployable state.

---

## 3. Full Folder Tree

```
BSCore/
│
│  ── Root configuration and project files ──
├── .env.example              ← Required env vars with placeholder values and descriptions
├── .gitattributes            ← Line ending enforcement
├── .gitignore
├── CLAUDE.md                 ← Claude Code session rules (read before coding)
├── next.config.ts            ← Next.js configuration
├── package.json
├── tsconfig.json             ← strict: true, path aliases configured
│
│  ── Static application configuration ──
├── config/
│   ├── app.config.ts         ← Site name, default locale, timezone, base URL
│   ├── modules.config.ts     ← Module activation list for this project
│   ├── routes.config.ts      ← Route prefix conventions (e.g. /admin, /api/v1)
│   ├── seo.config.ts         ← Global SEO fallback values (title template, OG defaults)
│   └── theme.config.ts       ← Design tokens, breakpoints, spacing scale
│
│  ── Documentation ──
├── docs/
│   ├── ARCHITECTURE.md
│   ├── BOUNDARIES.md
│   ├── ENGINEERING_RULES.md
│   ├── MODULES.md
│   ├── QUALITY_CHECKLIST.md
│   ├── REPOSITORY_STRUCTURE.md   ← this file
│   ├── RISKS.md
│   ├── SECURITY_RULES.md
│   ├── SEO_RULES.md
│   ├── SOCLE.md
│   ├── SOCLE_PLUS.md
│   ├── TESTING_STRATEGY.md
│   ├── UX_RULES.md
│   └── VISION.md
│
│  ── End-to-end tests ──
├── e2e/
│   ├── fixtures/             ← Shared E2E test data, page object models
│   ├── helpers/              ← Shared E2E utilities and setup functions
│   └── specs/                ← Test specifications organized by flow
│       ├── auth/
│       ├── admin/
│       ├── cms/
│       ├── blog/
│       └── forms/
│
│  ── Next.js static assets ──
├── public/                   ← Robots.txt, favicon, static images not processed by bundler
│
│  ── Application source ──
└── src/
    │
    │  ── Next.js App Router (routing layer only) ──
    ├── app/
    │   ├── layout.tsx              ← Root layout (HTML shell, global providers)
    │   ├── (public)/               ← Public route group
    │   │   ├── layout.tsx          ← Public layout (imports from shared/ui or client/)
    │   │   ├── page.tsx            ← Homepage (imports from client/pages/home/)
    │   │   └── [...slug]/          ← Dynamic CMS-driven pages
    │   │       └── page.tsx
    │   ├── admin/                  ← Admin shell (Socle+ auth guard applied in layout)
    │   │   ├── layout.tsx          ← Admin shell layout (from socle-plus/admin)
    │   │   ├── page.tsx            ← Admin dashboard
    │   │   └── [...module-section]/← Module admin sections registered dynamically
    │   └── api/                    ← API route handlers (thin — delegate to modules)
    │       └── [...]/
    │           └── route.ts
    │
    │  ── Socle: core infrastructure (zero DB, zero auth) ──
    ├── socle/
    │   ├── config/                 ← Config loader, env validator, typed config object
    │   ├── errors/                 ← Error base types, global error handler, error contract
    │   ├── logger/                 ← Logging interface (structured, level-aware)
    │   ├── middleware/             ← Security headers, CORS, rate limiting, request logging
    │   ├── routing/                ← Route group helpers, middleware chain registration
    │   ├── utils/                  ← Pure utilities: dates, strings, URLs, slugs
    │   └── index.ts                ← Socle public interface
    │
    │  ── Socle+: extended infrastructure (DB, auth, admin shell) ──
    ├── socle-plus/
    │   ├── auth/                   ← Login, logout, session lifecycle, password hashing
    │   ├── authorization/          ← RBAC engine, can(user, action, resource) interface
    │   ├── database/               ← DB connection pool, ORM setup, migration runner
    │   ├── admin/                  ← Admin shell container, nav registry, layout components
    │   ├── audit/                  ← Audit log service (writes security events to DB)
    │   └── index.ts                ← Socle+ public interface
    │
    │  ── Modules: independent domain blocks ──
    ├── modules/
    │   ├── cms/
    │   ├── blog/
    │   ├── media/
    │   ├── seo/
    │   ├── forms/
    │   ├── user-profile/
    │   └── [future-modules]/
    │
    │  ── Shared: reusable code with no business logic ──
    ├── shared/
    │   ├── ui/
    │   │   ├── primitives/         ← Atomic components: Button, Input, Badge, Icon, Avatar
    │   │   ├── patterns/           ← Composed components: DataTable, Modal, Toast, FormLayout
    │   │   └── admin/              ← Admin-specific: PageHeader, SectionCard, Breadcrumbs
    │   ├── types/                  ← Shared TypeScript interfaces (pagination, API shapes, etc.)
    │   └── constants/              ← App-wide constants (HTTP status codes, limits, etc.)
    │
    │  ── Client: project-specific code ──
    └── client/
        ├── pages/                  ← Project-specific page content and section components
        │   ├── home/
        │   ├── about/
        │   └── contact/
        ├── components/             ← Client-specific UI components not reusable elsewhere
        ├── extensions/             ← Module extensions via published extension points
        ├── integrations/           ← Third-party integrations unique to this client
        └── config/                 ← Client-specific config overrides (content, theme)
```

---

## 4. Top-Level Folder Reference

### `config/`
**Purpose:** Static, committed configuration that defines how this project instance behaves.

**What belongs here:**
- Module activation list (which modules are on)
- Route prefix conventions
- Build-time SEO defaults and fallbacks
- Design tokens and theme values
- App-level metadata (site name, default locale)

**What must NOT be here:**
- Secrets or credentials — those go in `.env`
- Dynamic settings managed through the admin UI — those are stored in the database by Socle+ or modules
- Business logic
- Environment-specific secrets

---

### `docs/`
**Purpose:** All project documentation. Single source of truth for architecture, rules, and decisions.

**What belongs here:**
- Architecture and boundary documents
- Engineering, security, UX, SEO, and testing rules
- The risk register
- Module catalog
- This file

**What must NOT be here:**
- Application code of any kind
- Generated files
- Temporary notes or personal scratch pads

---

### `e2e/`
**Purpose:** End-to-end tests only. These run against the full running application.

**What belongs here:**
- Playwright (or Cypress) test specifications
- Shared page object models and helpers
- E2E-specific fixtures and test data setup

**What must NOT be here:**
- Unit tests (those live next to source files)
- Integration tests (those live next to source files)
- Application code

---

### `public/`
**Purpose:** Static files served by Next.js without processing.

**What belongs here:**
- `robots.txt`
- `favicon.ico`
- Static images that must not be processed by the bundler (e.g., OG image defaults)

**What must NOT be here:**
- Uploaded user files — those are managed by Module: Media and stored outside the web root or in object storage
- Application code

---

### `src/app/`
**Purpose:** Next.js App Router. This is the **routing and layout layer only**. It wires routes to components; it contains no business logic.

**What belongs here:**
- `layout.tsx` files (root and per-section)
- `page.tsx` files that import content from `client/pages/`, module `ui/` components, or `shared/ui/`
- `route.ts` files for API endpoints (thin handlers that delegate to module services)
- Loading and error boundary files (`loading.tsx`, `error.tsx`)

**What must NOT be here:**
- Business logic
- Database queries
- Domain services
- UI components beyond the minimum glue to assemble a page
- Auth checks (those belong in `socle-plus/auth/` middleware, applied in layouts)

**Key pattern:** `src/app/(public)/page.tsx` imports `<HomePage />` from `src/client/pages/home/`. The `app/` file is 10 lines of Next.js wiring; the actual content is elsewhere.

---

### `src/socle/`
**Purpose:** Core infrastructure. Present in every project. Has zero database dependencies.

**What belongs here:**
- Everything listed in `docs/SOCLE.md`

**What must NOT be here:**
- Any import of a database client
- Any session, user, or auth concept
- Any business domain type

---

### `src/socle-plus/`
**Purpose:** Extended infrastructure. Activated per project when auth/DB/admin are needed.

**What belongs here:**
- Everything listed in `docs/SOCLE_PLUS.md`

**What must NOT be here:**
- Domain entities (posts, products, bookings)
- Module-specific logic
- Client-specific rules

---

### `src/modules/`
**Purpose:** Independent domain modules. Each module is a self-contained vertical slice.

**What belongs here:**
- One subfolder per module
- Each module's full stack: domain logic, data layer, API routes, admin UI, events

**What must NOT be here:**
- Cross-module imports (modules never import each other's internals)
- Client-specific logic
- Infrastructure code that belongs in Socle or Socle+

---

### `src/shared/`
**Purpose:** Code that is reusable across layers but has no business logic and no module affiliation.

**What belongs here:**
- Generic UI primitives and patterns (no domain knowledge)
- Shared TypeScript types that span multiple layers (e.g., `PaginationParams`, `ApiResponse<T>`)
- App-wide constants

**What must NOT be here:**
- Business logic
- Module-specific components (those live in `modules/[name]/ui/` or `modules/[name]/admin/`)
- Client-specific components (those live in `client/components/`)
- Anything that imports from Socle+, modules, or client

---

### `src/client/`
**Purpose:** Project-specific code. This is the layer that changes per client project.

**What belongs here:**
- Custom page content and sections
- Client-specific UI components
- Module extensions through published extension points
- Third-party integrations unique to this client
- Client-specific config overrides

**What must NOT be here:**
- Any modification of module files (use extension points instead)
- Reusable generic logic (promote to a module or shared/ if needed elsewhere)
- Infrastructure code

---

## 5. Module Internal Structure

Every module follows the same internal layout. Sections are either **MANDATORY** or **OPTIONAL** depending on whether the module uses that capability.

```
src/modules/blog/
│
├── index.ts                        ← MANDATORY: public interface + module registration function
├── blog.manifest.ts                ← MANDATORY: declared dependencies, metadata, activation config
│
├── domain/                         ← MANDATORY: pure business logic
│   ├── post.entity.ts              ← Domain entity type definition
│   ├── post-service.ts             ← Business rules (no HTTP, no DB)
│   ├── post-service.test.ts        ← Unit tests (alongside source)
│   └── post.errors.ts              ← Domain-specific typed errors
│
├── data/                           ← MANDATORY if module uses a database
│   ├── post-repository.ts          ← Data access functions (queries, mapping)
│   ├── post-repository.test.ts     ← Integration tests (alongside source)
│   └── migrations/                 ← Module-owned migrations
│       └── 001_create_posts.ts
│
├── api/                            ← MANDATORY if module exposes HTTP routes
│   ├── posts.routes.ts             ← Route definitions
│   ├── posts.handlers.ts           ← Request handlers (thin — call domain services)
│   ├── posts.schemas.ts            ← Zod validation schemas for all inputs
│   └── posts.routes.test.ts        ← Route-level integration tests
│
├── admin/                          ← OPTIONAL: admin panel section
│   ├── index.ts                    ← Registers nav items into Socle+ nav registry
│   └── components/                 ← Admin React components for this module
│       ├── PostList.tsx
│       └── PostEditor.tsx
│
├── ui/                             ← OPTIONAL: public-facing UI contracts
│   ├── PostCard.tsx                ← Reusable display component (no business logic)
│   └── PostList.tsx
│
├── events/                         ← OPTIONAL: event emitters and listeners
│   ├── post-events.ts              ← Event type definitions and emitter functions
│   └── post-event-listeners.ts    ← Listener registrations (e.g. handle user.deleted)
│
└── docs/                           ← OPTIONAL: module-specific documentation
    └── README.md                   ← Purpose, dependencies, events, extension points
```

### Mandatory vs Optional

| Subfolder | Required when |
|---|---|
| `index.ts` | Always |
| `[name].manifest.ts` | Always |
| `domain/` | Always (even read-only modules have domain logic) |
| `data/` | Module reads or writes to a database |
| `api/` | Module exposes HTTP routes |
| `admin/` | Module has an admin panel section |
| `ui/` | Module provides reusable public-facing UI components |
| `events/` | Module emits or listens to events |
| `docs/` | Module has non-obvious behavior or extension points |

### Rules for the `index.ts` (module public interface)

The `index.ts` is the **only** file other code may import from a module. It exports:
- The `register()` function (called by the activation mechanism at boot)
- Public service interfaces (called by other modules or client extensions)
- Public TypeScript types (used by API consumers)

It never exports:
- Internal domain functions
- Repository functions
- Internal helpers

### Rules for the manifest file

`blog.manifest.ts` declares:
- Module ID and display name
- Required dependency tier (`socle` or `socle-plus`)
- Explicit dependencies on other modules (`['media']`)
- Required environment variables

---

## 6. Client-Specific Structure

```
src/client/
│
├── pages/                          ← Full page section components for this project
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   └── index.ts
│   ├── about/
│   └── contact/
│
├── components/                     ← Client-specific UI components (not reusable)
│   ├── ClientHeader.tsx
│   └── ClientFooter.tsx
│
├── extensions/                     ← Extensions using module-published extension points
│   ├── booking-extension.ts        ← Extends Module: Booking with client-specific rules
│   └── cms-extension.ts            ← Registers custom content types in CMS
│
├── integrations/                   ← Third-party integrations specific to this client
│   ├── whatsapp-notifications.ts
│   └── legacy-erp-sync.ts
│
└── config/                         ← Client-specific config overrides
    ├── content.config.ts           ← Client content: nav labels, footer text, etc.
    └── theme.override.ts           ← Client-specific design token overrides
```

### Client rules

- `extensions/` files call module public interfaces only — never internal module code.
- `integrations/` may call external APIs directly — these are one-off integrations by definition.
- When a client extension needs something a module doesn't expose, add an extension point to the module — don't patch the module file.
- Nothing in `src/client/` is ever merged back to the base repository.

---

## 7. Shared UI Structure

```
src/shared/ui/
│
├── primitives/                     ← Atomic, fully generic UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Icon.tsx
│   ├── Avatar.tsx
│   ├── Spinner.tsx
│   └── index.ts
│
├── patterns/                       ← Composed generic components (assemble primitives)
│   ├── DataTable.tsx               ← Generic table with sort, pagination
│   ├── Modal.tsx                   ← Accessible modal with focus trap
│   ├── Toast.tsx                   ← Notification toast
│   ├── FormLayout.tsx              ← Standard form wrapper with label/error layout
│   ├── EmptyState.tsx              ← Generic empty state with optional CTA
│   ├── ErrorBoundary.tsx
│   └── index.ts
│
└── admin/                          ← Generic admin shell UI components
    ├── PageHeader.tsx              ← Title + action buttons row
    ├── SectionCard.tsx             ← Content card for admin sections
    ├── Breadcrumbs.tsx
    ├── NavItem.tsx                 ← Admin sidebar nav item
    └── index.ts
```

### Shared UI rules

- No component in `shared/ui/` imports from modules, Socle+, or client.
- No component in `shared/ui/` contains business logic or domain knowledge.
- Domain-aware components (e.g., `PostCard`, `BookingCalendar`) live in their module's `ui/` subfolder, not here.
- Admin-specific domain components (e.g., `PostEditor`, `MediaBrowser`) live in their module's `admin/components/` subfolder.

---

## 8. Testing Structure

Unit and integration tests live **next to the source they test**. Only E2E tests are in a dedicated top-level directory.

```
src/modules/blog/
├── domain/
│   ├── post-service.ts
│   └── post-service.test.ts        ← Unit test (alongside)
├── data/
│   ├── post-repository.ts
│   └── post-repository.test.ts     ← Integration test (alongside)
└── api/
    ├── posts.handlers.ts
    └── posts.routes.test.ts        ← Route integration test (alongside)

src/socle/
└── config/
    ├── config-loader.ts
    └── config-loader.test.ts       ← Unit test (alongside)

e2e/
├── fixtures/
│   ├── users.ts                    ← User factories for E2E
│   └── database.ts                 ← DB seed/reset helpers
├── helpers/
│   ├── auth.helper.ts              ← Login helper for E2E setup
│   └── navigation.helper.ts
└── specs/
    ├── auth/
    │   ├── login.spec.ts
    │   └── session-expiry.spec.ts
    ├── admin/
    │   └── admin-nav.spec.ts
    ├── cms/
    │   └── publish-page.spec.ts
    └── blog/
        └── write-post.spec.ts
```

### Test file conventions

| Test type | Location | Naming |
|---|---|---|
| Unit test | Next to source file | `[filename].test.ts` |
| Integration test | Next to source file | `[filename].test.ts` |
| E2E test | `e2e/specs/[domain]/` | `[flow].spec.ts` |
| E2E fixture | `e2e/fixtures/` | `[entity].ts` |
| E2E helper | `e2e/helpers/` | `[purpose].helper.ts` |

Consult `docs/TESTING_STRATEGY.md` for coverage requirements per layer and module.

---

## 9. Configuration Structure

### 9.1 Static configuration (committed to repository)

Lives in `config/`. Version-controlled. Applies at build time or application start.

| File | Contents |
|---|---|
| `config/app.config.ts` | Site name, base URL, default locale, timezone |
| `config/modules.config.ts` | Array of active module IDs for this project instance |
| `config/routes.config.ts` | Route prefix conventions (`/admin`, `/api/v1`, locale prefixes) |
| `config/seo.config.ts` | Global SEO fallbacks: title template, default OG image, robots default |
| `config/theme.config.ts` | Design tokens, color palette, typography scale, breakpoints |

**Rule:** Static config values are import-time constants. They never read from the database.

### 9.2 Environment configuration (`.env`, not committed)

Lives in `.env` (gitignored). Documented in `.env.example` with placeholders.

| Variable type | Examples |
|---|---|
| Database | `DATABASE_URL` |
| Auth secrets | `SESSION_SECRET`, `JWT_SECRET` |
| External services | `SMTP_HOST`, `S3_BUCKET`, `STRIPE_SECRET_KEY` |
| Runtime behavior | `NODE_ENV`, `LOG_LEVEL`, `RATE_LIMIT_MAX` |

**Rule:** Accessed only through the typed config object in `src/socle/config/`. No `process.env` calls outside that file.

### 9.3 Dynamic configuration (stored in database, managed via admin)

Managed at runtime through the Socle+ admin shell. Not committed to the repository.

| Setting type | Examples | Who manages it |
|---|---|---|
| Site identity | Site title, tagline, logo, contact info | Admin |
| Per-page SEO overrides | Custom meta title, description, canonical | Content editor |
| Module settings | Posts per page, allowed file types, max upload size | Admin |
| Feature flags | Enable/disable a feature at runtime | Admin |
| Notification templates | Email subject, body, sender name | Admin |

**Rule:** Dynamic config is stored in a dedicated `settings` table or equivalent, never in static files.

---

## 10. Placement Examples

### Correct placements

| What | Where | Why |
|---|---|---|
| HTTP security headers | `src/socle/middleware/` | Infrastructure, needed by all projects |
| Password hashing function | `src/socle-plus/auth/` | Auth infrastructure |
| Blog post entity type | `src/modules/blog/domain/post.entity.ts` | Domain concept owned by Blog module |
| Blog post admin editor | `src/modules/blog/admin/components/PostEditor.tsx` | Module admin UI |
| Reusable `<DataTable>` | `src/shared/ui/patterns/DataTable.tsx` | Generic, no domain knowledge |
| Home page hero section | `src/client/pages/home/HeroSection.tsx` | Project-specific content |
| WhatsApp booking alert | `src/client/integrations/whatsapp-notifications.ts` | Client-specific integration |
| Login page route | `src/app/(auth)/login/page.tsx` | Next.js routing |
| Booking event emitter | `src/modules/booking/events/booking-events.ts` | Module owns its events |
| DB migration for posts | `src/modules/blog/data/migrations/001_create_posts.ts` | Migrations belong to their module |

### Incorrect placements

| What | Wrong location | Correct location | Why |
|---|---|---|---|
| DB connection setup | `src/socle/database.ts` | `src/socle-plus/database/` | Socle has no DB |
| Blog post CRUD | `src/socle-plus/posts.ts` | `src/modules/blog/` | Domain logic doesn't belong in infrastructure |
| `<PostCard>` component | `src/shared/ui/primitives/` | `src/modules/blog/ui/` | Domain-aware, not generic |
| Client-specific cancellation rule | `src/modules/booking/domain/booking-service.ts` | `src/client/extensions/booking-extension.ts` | Client rule pollutes a module |
| `process.env.DATABASE_URL` call | `src/modules/cms/data/repository.ts` | Access via `src/socle/config/` | Bypasses central config |
| Admin nav items array | `src/socle-plus/admin/nav.ts` (hardcoded) | Registered dynamically by each module | Shell has no domain knowledge |
| User profile fields | `src/socle-plus/auth/user.ts` | `src/modules/user-profile/` | Socle+ user is minimal |
| E2E test for login | `src/socle-plus/auth/login.spec.ts` | `e2e/specs/auth/login.spec.ts` | E2E tests are in `e2e/`, not next to source |

---

## 11. Key Decisions

### Decision: `src/` wrapper for all application code
All application code lives under `src/`. The repository root contains only project-level files (config, package, docs, gitfiles). This keeps the root clean and is standard for Next.js projects.

### Decision: `src/app/` is a routing layer, nothing more
The Next.js `app/` directory contains only `layout.tsx`, `page.tsx`, `route.ts`, and their loading/error siblings. All substantive components are imported from their owning layer (`client/pages/`, `modules/[name]/ui/`, `shared/ui/`). This prevents business logic from accumulating in the routing layer.

### Decision: `src/client/` name over `project/` or `custom/`
The name `client/` is chosen because the layer represents the client project (the deliverable), not "client-side code". The distinction is documented here and in `docs/BOUNDARIES.md`. If the ambiguity causes confusion, `project/` is the next preferred name.

### Decision: Unit and integration tests co-located with source
Tests live next to the file they test. This makes it immediately obvious what is and isn't tested, and keeps tests and source together when a module is moved or renamed. Only E2E tests are separated because they require a running application and are cross-module by nature.

### Decision: `config/` at repository root, not inside `src/`
Configuration files are not TypeScript modules with business logic — they are data files that define project behavior. Keeping them at the root makes them immediately visible and distinct from the application layers.

### Decision: Migrations inside modules, not in a shared folder
Each module owns its schema. Migrations live at `src/modules/[name]/data/migrations/`. Socle+ provides a migration runner that discovers and applies them in order at boot. Centralized migrations create ambiguity about ownership and make module removal harder.

---

## 12. Open Questions

### OQ-1: tsconfig path aliases
Path aliases (`@/socle`, `@/modules/blog`, etc.) will be needed to avoid deep relative imports. The exact alias mapping should be decided when `tsconfig.json` is created and documented as an addendum here.

### OQ-2: Shared module sub-packages
If two modules share a genuine abstraction (as noted in `docs/BOUNDARIES.md`), it would live in `src/modules/shared/` or be extracted to a named sub-directory. The naming convention for these exceptional shared modules is not yet defined.

### OQ-3: CSS and styling strategy
`config/theme.config.ts` covers design tokens, but the CSS approach (Tailwind, CSS Modules, CSS-in-JS) is not decided. The structure accommodates any of these. The decision should be made before the first UI component is written and documented here.

### OQ-4: Storybook / component catalog
If a component development environment (Storybook) is added, its configuration and story files would live at the root level (`/.storybook/`) with stories co-located next to components. This needs to be confirmed when the UI layer is built.
