# TECH STACK — BSCore V1

## 1. Overview

This document defines the concrete technical choices for the first implementation of BSCore. It translates the architecture decisions in `docs/ARCHITECTURE.md` and layer rules in `docs/BOUNDARIES.md` into specific tools and libraries.

All choices below are considered **decided and stable** for V1. Postponed decisions are listed explicitly in Section 9 and must not be resolved by implicit implementation choices.

---

## 2. Runtime and Framework

### Next.js — App Router

**Choice:** Next.js 14+ with the App Router.

**Why App Router over Pages Router:**
- React Server Components (RSC) allow data fetching at the component level without waterfalls, which fits the module-driven architecture.
- Nested layouts map naturally to the `socle-plus/admin/` shell + module section structure.
- Route groups (`(public)`, `(admin)`) enforce the access boundary between public and protected pages at the routing level.
- Streaming and Suspense are available by default for progressive loading states.
- `route.ts` API handlers are co-located with their route tree, making API surface easy to trace.

**How App Router is used in BSCore:**
The `src/app/` directory is **routing and layout only** (see `docs/REPOSITORY_STRUCTURE.md`). Page files import components from their owning layer:

```
src/app/(public)/blog/[slug]/page.tsx
  → imports PostPage from src/modules/blog/ui/
  → fetches data via module service (server component)

src/app/admin/cms/page.tsx
  → imports CmsAdminPage from src/modules/cms/admin/components/
  → auth guard applied in src/app/admin/layout.tsx
```

No business logic, no domain imports, no database access inside `src/app/`.

### Node.js

Next.js runs on Node.js. No runtime-specific constraints beyond what Next.js requires.

---

## 3. TypeScript

**Choice:** TypeScript with `strict: true`.

All rules from `docs/ENGINEERING_RULES.md` apply. Key tsconfig settings:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/socle/*":      ["./src/socle/*"],
      "@/socle-plus/*": ["./src/socle-plus/*"],
      "@/modules/*":    ["./src/modules/*"],
      "@/shared/*":     ["./src/shared/*"],
      "@/client/*":     ["./src/client/*"],
      "@/config/*":     ["./config/*"]
    }
  }
}
```

### Path Aliases

| Alias | Resolves to | Purpose |
|---|---|---|
| `@/socle/*` | `src/socle/*` | Core infrastructure imports |
| `@/socle-plus/*` | `src/socle-plus/*` | Extended infrastructure imports |
| `@/modules/*` | `src/modules/*` | Module public interface imports |
| `@/shared/*` | `src/shared/*` | Shared UI, types, constants |
| `@/client/*` | `src/client/*` | Project-specific code |
| `@/config/*` | `config/*` | Static config files |

**Rules for alias usage:**

- A module's internal code uses relative imports within the module (`./domain/post-service`).
- Code outside a module uses `@/modules/blog` to access its public interface — never a deep path like `@/modules/blog/domain/post-service`.
- `@/socle-plus/*` is never imported inside `src/socle/`.
- `@/modules/*` is never imported inside `src/socle/` or `src/socle-plus/`.

The `next.config.ts` must mirror these aliases so the bundler resolves them:

```ts
// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  // Next.js reads tsconfig paths automatically when using the bundler moduleResolution
}
export default config
```

---

## 4. Styling

### Tailwind CSS

**Choice:** Tailwind CSS v3/v4. No CSS-in-JS. No heavy UI component framework imposed at the core level.

**Why Tailwind:**
- **No runtime cost.** Tailwind generates static CSS at build time. Unlike CSS-in-JS solutions (Styled Components, Emotion), there is no style injection at runtime and no hydration mismatch risk with SSR and React Server Components.
- **Works perfectly with RSC.** Server Components cannot use runtime CSS-in-JS because they have no client-side React context. Tailwind classes work in any component, server or client.
- **Built-in design scale.** Consistent spacing, typography, and color scales eliminate arbitrary magic numbers across the codebase.
- **Easy project-level theming.** CSS variables + Tailwind config extension allow brand-level customization without touching component code.
- **Tree-shaking by default.** Only utility classes actually used in the codebase appear in the output bundle.

### Where Shared UI Primitives Live

```
src/shared/ui/
├── primitives/     ← Button, Input, Badge, Icon, Avatar, Spinner
├── patterns/       ← DataTable, Modal, Toast, FormLayout, EmptyState
└── admin/          ← PageHeader, SectionCard, Breadcrumbs, NavItem
```

Shared primitives are **structural**: they define layout, spacing, interaction behavior, and accessibility. They do **not** hard-code brand colors, fonts, or opinionated visual styles.

Example principle for a `Button` component:
- It accepts a `variant` prop (`primary`, `secondary`, `ghost`, `destructive`).
- Colors for each variant are driven by CSS variables (`--color-primary`, `--color-destructive`), not hard-coded Tailwind color classes (`bg-blue-600`).
- The component applies layout, padding, border-radius, focus ring, and disabled states — things that are consistent across projects.
- Each project sets its CSS variable values in its own `globals.css`.

### Where Project-Specific Styling Lives

```
src/client/
├── pages/          ← Custom page sections with project-specific Tailwind classes
├── components/     ← Client-specific components, freely styled
└── config/
    └── theme.override.ts  ← Tailwind config extension for this client
```

```
src/app/
└── globals.css     ← CSS variable definitions for this project (brand colors, fonts, etc.)
```

### Theming Strategy

Project theming works at two levels:

**Level 1 — CSS variables (brand identity):**
```css
/* src/app/globals.css — per project */
:root {
  --color-primary:     210 100% 45%;
  --color-primary-fg:  0 0% 100%;
  --color-secondary:   210 40% 96%;
  --color-destructive: 0 84% 60%;
  --radius:            0.5rem;
  --font-sans:         'Inter', sans-serif;
}
```

**Level 2 — Tailwind config extension (project-specific scales):**
```ts
// config/theme.config.ts — per project
export const themeExtension = {
  colors: {
    brand: 'hsl(var(--color-primary) / <alpha-value>)',
  },
  borderRadius: {
    DEFAULT: 'var(--radius)',
  },
}
```

### Avoiding Generic-Looking Websites

Reuse at the platform level (shared primitives) does not produce generic-looking projects because:
- Primitives provide **behavior and structure**, not visual identity.
- Project sections (`src/client/pages/`) are fully custom.
- Typography, color palette, spacing rhythm, and brand imagery are set per project.
- A shared `<Button>` component on project A looks nothing like the same component on project B if their CSS variables differ.

### What Is NOT Imposed at the Core

- **No shadcn/ui** as a core dependency. Client projects may freely choose to integrate shadcn, Radix UI, Headless UI, or any other component library on top of the shared primitives. The platform does not depend on any of these.
- **No Tailwind preset published by BSCore.** Each project configures Tailwind from its own `tailwind.config.ts`, extending the base with `config/theme.config.ts`.

---

## 5. Validation

### Zod

**Choice:** Zod for all schema validation.

**Where Zod is used:**

| Location | Purpose |
|---|---|
| `src/socle/config/` | Validates all environment variables at startup |
| `src/modules/*/api/*.schemas.ts` | Validates all HTTP request inputs (body, query, params) |
| `src/modules/*/domain/` | May use Zod for value object validation |
| `config/*.config.ts` | Validates static config values at import time |

**Rules:**
- One validation library for the entire project. Do not mix Zod with Joi, Yup, or manual validation.
- Infer TypeScript types from schemas: `type CreatePostInput = z.infer<typeof createPostSchema>`. Do not duplicate type definitions.
- Validation schemas for HTTP inputs live in `api/*.schemas.ts` within their module — not in the domain layer.
- The domain layer receives already-typed, already-validated inputs. It performs business-rule validation (e.g., "booking date must be in the future"), not structural validation.
- Zod `parse()` throws on failure and returns a typed value on success. Use `safeParse()` when you need to handle errors without a try/catch.

---

## 6. Testing

### Vitest — Unit and Integration Tests

**Choice:** Vitest for all unit and integration tests.

**Why Vitest over Jest:**
- ESM-native. Next.js uses ESM; Vitest does not require transformation workarounds.
- Significantly faster than Jest for watch mode and cold starts.
- Compatible API with Jest — minimal learning curve.
- First-class TypeScript support without additional configuration.
- `vi.mock()`, `vi.spyOn()`, and `vi.fn()` are available when needed (for external services only — see mocking rules below).

**Vitest configuration scope:**
```
vitest.config.ts          ← root config, points at src/
vitest.integration.config.ts  ← separate config for integration tests (longer timeout, DB setup)
```

**What Vitest tests:**
- Unit tests: domain services, Zod schemas, pure utilities, error types.
- Integration tests: repositories (against a real test DB), module service layer, event system wiring.

**Mocking rules (aligned with `docs/TESTING_STRATEGY.md`):**
- External HTTP APIs (Stripe, Brevo, etc.): mocked with `vi.mock()` or MSW.
- System time (for scheduling, expiry logic): mocked with `vi.useFakeTimers()`.
- **Database: never mocked in integration tests.** Integration tests run against a real PostgreSQL test instance. This is non-negotiable.

### Playwright — E2E Tests

**Choice:** Playwright for all end-to-end tests.

**Why Playwright:**
- Cross-browser by default (Chromium, Firefox, WebKit).
- Excellent support for Next.js SSR pages and server actions.
- Built-in tracing, screenshots, and video on failure.
- API testing utilities for verifying API routes in E2E context.

**Playwright scope:**
- Critical user flows: login, publish content, submit form, complete checkout.
- Admin workflows: create/edit/delete in each module's admin section.
- Security flows: unauthenticated access to admin routes, unauthorized data access attempts.

**Playwright setup:**
```
e2e/
├── playwright.config.ts
├── fixtures/
├── helpers/
└── specs/
```

### Test Placement (Summary)

| Test type | Location | Runner |
|---|---|---|
| Unit | `src/*/**.test.ts` (alongside source) | Vitest |
| Integration | `src/*/**.test.ts` (alongside source) | Vitest (integration config) |
| E2E | `e2e/specs/**/*.spec.ts` | Playwright |

---

## 7. Database Strategy

### Socle — Zero Database Dependencies

Socle has no database client, no ORM, no connection pool. This is enforced structurally: `src/socle/` must have no dependencies on any database package.

A Socle-only project must be deployable to a static host or a serverless environment with no database. This constraint must never be violated — not even for "just configuration."

If a CI check reveals a database import inside `src/socle/`, it is a bug.

### Socle+ — PostgreSQL via Supabase

**Choice:** PostgreSQL as the database. Supabase as the managed PostgreSQL host for Socle+ projects.

**Why Supabase:**
- Managed PostgreSQL with no operational overhead for small-to-medium projects.
- Row Level Security (RLS) provides a database-level authorization layer complementary to Socle+'s RBAC.
- Supabase Storage is available for Module: Media when needed.
- The Supabase client (`@supabase/supabase-js`) is a lightweight PostgreSQL interface — BSCore owns the schema and all business logic. We are not using Supabase as an application platform.

**Architectural boundary:**
- Supabase is **infrastructure**. `src/socle-plus/database/` wraps the connection and provides it to modules. Modules never import the Supabase client directly.
- Business logic never leaks into the database layer. No business rules in database triggers or stored procedures.
- Row Level Security policies are an additional security layer, not a replacement for application-level authorization checks.

**ORM / Query Builder:** Decision deferred (see Section 9). Options: Prisma, Drizzle ORM, or Supabase's built-in query builder. The database layer in `src/socle-plus/database/` will abstract whichever is chosen so that modules are not coupled to the specific ORM.

**Migrations:** Each module owns its migrations in `src/modules/[name]/data/migrations/`. The Socle+ migration runner discovers and applies them in order. Migration files are TypeScript or SQL — format to be confirmed when the ORM is chosen.

**Test database:** Integration tests run against a dedicated PostgreSQL test database, seeded fresh per test run. The test database is never the development or production database.

---

## 8. What Is Not Included in V1

These tools and features have been explicitly decided against or deferred:

| Item | Status | Reason |
|---|---|---|
| Storybook | Postponed | UI component catalog is valuable but not needed before the first real project ships |
| CSS-in-JS (Styled Components, Emotion) | Excluded | Runtime cost, RSC incompatibility, replaced by Tailwind |
| shadcn/ui as core dependency | Excluded | Client projects may use it; the platform does not impose it |
| Multi-tenancy | Postponed | No project currently requires it; flagged in `docs/SOCLE_PLUS.md` |
| Shared sub-modules between modules | Postponed | No proven need yet; introduce only when required in 2+ modules |
| GraphQL | Not planned | REST via Next.js route handlers is sufficient for V1 |
| tRPC | Not planned | Adds complexity; JSON REST is sufficient and simpler to trace |
| React Query / SWR | Not decided | Relevant for complex client-side data fetching; decide when needed |

---

## 9. Postponed Technical Decisions

These decisions are explicitly open. They must be resolved before the relevant feature is built, not before.

| Decision | Resolve before | Notes |
|---|---|---|
| ORM / Query Builder (Prisma vs Drizzle vs raw) | Socle+ database layer implementation | Both are compatible with Supabase/PostgreSQL |
| Email service provider (Brevo, Resend, Postmark) | Module: Notifications implementation | Socle+ transport layer will abstract the provider |
| File storage backend (Supabase Storage vs S3) | Module: Media implementation | Config-level choice, abstracted by the module |
| CI/CD pipeline tooling (GitHub Actions, etc.) | First project deployment | Not a platform concern |
| React Query / SWR | First feature with complex client-side state | Only needed if server components aren't sufficient |
| Storybook | After V1 ships | Add when component library stabilizes |

---

## 10. Dependency Philosophy

Every production dependency added to this project must answer yes to all of:
- Is it actively maintained?
- Is its bundle impact acceptable for its value?
- Is its license compatible (MIT, Apache 2.0, ISC)?
- Does it have no known critical CVEs?
- Could the problem it solves not be solved in <20 lines of straightforward code?

Runtime dependencies are reviewed before every release. `npm audit` must pass with no critical issues.

---

## 11. Quick Reference

| Concern | Tool | Location |
|---|---|---|
| Framework | Next.js App Router | `src/app/` |
| Language | TypeScript strict | All `src/` |
| Styling | Tailwind CSS | All components |
| Validation | Zod | `*/api/*.schemas.ts`, `socle/config/` |
| Unit/integration tests | Vitest | `*.test.ts` alongside source |
| E2E tests | Playwright | `e2e/specs/` |
| Database (Socle+) | PostgreSQL / Supabase | `src/socle-plus/database/` |
| ORM | TBD (Prisma or Drizzle) | `src/socle-plus/database/` |
| Component library | Custom shared primitives | `src/shared/ui/` |
