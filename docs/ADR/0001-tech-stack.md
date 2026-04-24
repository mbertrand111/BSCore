# ADR-0001 — V1 Tech Stack

| Field | Value |
|---|---|
| **ID** | 0001 |
| **Date** | 2026-04-24 |
| **Status** | Accepted |
| **Deciders** | Project owner |
| **Supersedes** | — |
| **Superseded by** | — |

---

## Context

BSCore is a reusable web platform for building custom client websites, structured in four layers: Socle, Socle+, Modules, and Client-specific. Before writing any application code, the concrete technical tools for V1 must be fixed so that all future implementation decisions are consistent and all documentation is grounded in reality.

The following constraints shaped these choices:
- Socle must run with no database — it must be deployable to a static or serverless host.
- The front-end must remain project-specific. Shared UI primitives must be structural, not opinionated.
- The platform targets one developer initially, with eventual multi-developer projects.
- Security and maintainability take precedence over developer experience shortcuts.
- V1 must be pragmatic: no features for hypothetical future needs.

---

## Decisions

### 1. Next.js App Router

**Decision:** Use Next.js with the App Router (not Pages Router).

**Rationale:**
- React Server Components allow server-side data fetching at the component level without prop drilling or client-side waterfalls.
- Nested layouts map cleanly to the admin shell container (Socle+) + module section pattern.
- Route groups enforce the public/admin boundary at the routing layer.
- The App Router is the current and future-supported model. Pages Router is in maintenance mode.

**Consequences:**
- CSS-in-JS frameworks that require a React client context are incompatible with Server Components. This reinforces the Tailwind choice.
- `src/app/` must remain thin routing/layout code. All substantive logic lives in the owning layer (modules, socle-plus, client).
- Server actions are available for form mutations, but must delegate to module domain services — no business logic in server actions directly.

---

### 2. TypeScript Strict Mode

**Decision:** TypeScript with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.

**Rationale:**
- Strict mode catches the majority of type errors that lead to runtime bugs.
- `noUncheckedIndexedAccess` forces explicit null handling on array/object access — critical for data layer code.
- The cost (more type annotations) is paid once per implementation; the benefit compounds over the life of the project.

**Consequences:**
- `any` is banned. All code that deals with unknown external data uses `unknown` + Zod parsing.
- Type assertions (`as T`) require a justification comment.
- Third-party libraries with poor type definitions require explicit `@types/*` packages or manual declaration files.

---

### 3. Path Aliases

**Decision:** Six TypeScript path aliases defined in `tsconfig.json` and resolved by Next.js bundler:

```
@/socle/*       → src/socle/*
@/socle-plus/*  → src/socle-plus/*
@/modules/*     → src/modules/*
@/shared/*      → src/shared/*
@/client/*      → src/client/*
@/config/*      → config/*
```

**Rationale:**
- Aliases make layer boundaries visible in import statements. An import from `@/modules/blog` is immediately recognizable as a cross-layer call.
- Prevents deep relative imports (`../../../../socle/errors`) that obscure where code comes from.
- Makes enforcing boundary rules in code review easier: a file in `src/socle/` must never import from `@/modules/*` or `@/socle-plus/*`.

**Consequences:**
- Any alias violation (`@/socle-plus/*` inside `src/socle/`) must be caught in code review.
- A lint rule (e.g., `eslint-plugin-boundaries` or a custom rule) should be added to automate this check — deferred to implementation phase.

---

### 4. Tailwind CSS

**Decision:** Tailwind CSS for all styling. No CSS-in-JS. No heavy UI component framework imposed at the platform level.

**Rationale:**
- CSS-in-JS (Styled Components, Emotion) is incompatible with React Server Components without forcing components to the client. This conflicts with the App Router model.
- Tailwind generates static CSS at build time. Zero runtime cost, zero hydration mismatch risk.
- Theming via CSS variables + Tailwind config extension allows each project to define its own visual identity without modifying shared primitive code.
- Keeping the platform free of a component library dependency (shadcn, Chakra, MUI) avoids imposing that library's design language, versioning, and bundle weight on every client project.

**shadcn/ui:** Not a core dependency. Client projects may freely use it. The platform's shared primitives are built to the same structural pattern (accessible, composable, variant-driven) so that a client project could use shadcn components alongside them without conflict.

**Consequences:**
- Shared primitives in `src/shared/ui/` must be written without hard-coded color classes. Colors come from CSS variables.
- Each project defines its brand in `src/app/globals.css` (CSS variables) and `config/theme.config.ts` (Tailwind extension).
- Developers must be comfortable with Tailwind utility-class authoring.
- Long `className` strings are expected. Utility functions like `clsx` or `tailwind-merge` should be used to manage conditional classes.

---

### 5. Zod for Validation

**Decision:** Zod as the sole validation library.

**Rationale:**
- Zod integrates TypeScript types directly with runtime validation. A single schema definition produces both the runtime validator and the static type.
- It is the de facto standard in the Next.js / TypeScript ecosystem.
- Using a single library across config validation, API input validation, and domain value objects keeps the validation model consistent.

**Consequences:**
- All validation schemas for HTTP inputs live in `*/api/*.schemas.ts` within their module.
- Config validation in `src/socle/config/` uses Zod to parse `process.env` at startup. Missing or malformed variables fail loudly at boot, not silently at runtime.
- Do not use Zod for output validation of internal function calls — TypeScript types are sufficient there.

---

### 6. Vitest for Unit and Integration Tests

**Decision:** Vitest for all unit and integration tests.

**Rationale:**
- Vitest is ESM-native and integrates without friction with Next.js and TypeScript.
- Its Jest-compatible API means existing patterns and documentation apply.
- Watch mode performance is significantly better than Jest for a TypeScript monolith.

**Integration test rule:** The database is never mocked in integration tests. Integration tests run against a real PostgreSQL test instance. This is a firm rule documented in `docs/TESTING_STRATEGY.md`. Mocking the database produces tests that pass while masking real schema or query errors.

**Consequences:**
- A test PostgreSQL instance must be available in CI (Docker Compose or GitHub Actions service container).
- Two Vitest configs: one for fast unit tests (`vitest.config.ts`), one for slower integration tests with longer timeouts and DB setup (`vitest.integration.config.ts`).

---

### 7. Playwright for E2E Tests

**Decision:** Playwright for all end-to-end tests.

**Rationale:**
- Playwright tests real browser behavior across Chromium, Firefox, and WebKit from a single test suite.
- It handles Next.js server rendering and navigation correctly.
- Built-in tracing, screenshots, and videos on failure improve debugging.

**Consequences:**
- E2E tests run against a fully booted development or staging instance.
- They are the slowest tests and run in CI before deployment (not on every PR).
- E2E tests live in `e2e/specs/` and are the only tests not co-located with source.

---

### 8. PostgreSQL via Supabase for Socle+

**Decision:** PostgreSQL as the database. Supabase as the managed host when Socle+ is activated.

**Socle stays DB-free:** `src/socle/` has zero database imports. This is a structural rule, not a convention.

**Why Supabase:**
- Managed PostgreSQL removes operational burden for V1 projects.
- Row Level Security is a useful secondary authorization layer.
- Supabase Storage covers file upload needs for Module: Media without a separate S3 setup.
- The Supabase client is used for the database connection only. BSCore owns all schema and logic.

**ORM decision is deferred.** Prisma and Drizzle ORM are both viable. The choice will be made when Socle+ database layer implementation begins. The `src/socle-plus/database/` abstraction must ensure modules are not coupled to the ORM.

**Consequences:**
- Supabase project credentials (`DATABASE_URL`, `SUPABASE_SERVICE_KEY`) are environment variables, not static config.
- Modules own their migrations. Socle+ provides the runner.
- No business logic in database functions, triggers, or stored procedures.
- Row Level Security policies are a supplement to, not a replacement for, application authorization checks.

---

## Rejected Alternatives

| Alternative | Reason rejected |
|---|---|
| Pages Router | Maintenance mode; App Router is the strategic direction |
| Styled Components / Emotion | Incompatible with RSC; runtime cost; hydration risk |
| shadcn/ui as core dependency | Imposes design language on all projects; clients must choose freely |
| Jest | Slower than Vitest in ESM/TypeScript projects; no meaningful advantage |
| Cypress | Playwright has broader browser support and better RSC/SSR handling |
| MySQL / SQLite | PostgreSQL is more capable; Supabase only supports PostgreSQL |
| Prisma (decided now) | Deferred — both Prisma and Drizzle are valid; choose at implementation time |
| tRPC | Adds abstraction layer; REST via Next.js route handlers is sufficient |
| GraphQL | Over-engineered for this use case at V1 |

---

## Postponed Decisions

These are explicitly open and must not be resolved by implicit implementation choices:

| Decision | Deferred until |
|---|---|
| ORM choice (Prisma vs Drizzle) | Socle+ database layer implementation |
| Email service provider | Module: Notifications |
| File storage backend | Module: Media |
| React Query / SWR | First complex client-side data fetching need |
| Storybook | After V1 ships |
| Multi-tenancy strategy | When a project requires it |
| Shared sub-modules | When proven needed in 2+ modules |
| Lint rule for boundary enforcement | Implementation phase setup |

---

## Consequences Summary

- All V1 implementation must be written in TypeScript strict mode with these tools.
- Any deviation from these choices requires a new ADR entry and documentation update.
- Postponed decisions must not be resolved implicitly. If an implementation requires a postponed decision, pause and document the choice as a new ADR first.
