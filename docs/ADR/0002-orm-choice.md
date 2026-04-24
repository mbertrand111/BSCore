# ADR-0002 — ORM and Database Toolkit Choice

| Field | Value |
|---|---|
| **ID** | 0002 |
| **Date** | 2026-04-24 |
| **Status** | Accepted |
| **Deciders** | Project owner |
| **Supersedes** | — |
| **Superseded by** | — |

---

## Context

ADR-0001 fixed the database host as PostgreSQL via Supabase and explicitly deferred the ORM or query builder choice to "Socle+ database layer implementation." That implementation phase has now begun. This decision must be made before any Socle+ code is written.

The choice of database toolkit has architectural implications beyond query syntax. It determines:
- how module schemas are defined and co-located with their code
- how migrations are authored, discovered, and applied
- what module developers import when writing repositories
- how tightly the database access layer is coupled to a specific abstraction

BSCore has firm constraints that narrow the field:

**Socle must remain database-free.** `src/socle/` must compile and run with no database package imported, directly or transitively. This is a structural rule: a Socle-only project must be deployable to a static host with no database.

**Socle+ owns the shared database connection.** The `db` client is created once in `src/socle-plus/database/` and exported for use by the rest of the application. Modules receive this client — they do not create connections.

**Modules own their own schemas and migrations.** Each module defines its Drizzle table schemas in TypeScript alongside its data layer code, and its migrations under `src/modules/[name]/data/migrations/`. Socle+ provides the migration runner that discovers and applies them.

**The toolkit must not require a code-generation step in the normal development workflow.** Code generation introduces a build-time prerequisite that complicates CI pipelines, local development, and the module authoring experience.

**TypeScript strict mode is non-negotiable.** `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. Any toolkit that generates types or has known friction with these settings requires additional justification.

---

## Decision

**Use Drizzle ORM** (`drizzle-orm` + `drizzle-kit`) for all Socle+ database access and all module data layers.

---

## Rationale

### Drizzle schema definitions are TypeScript

Drizzle schemas are written in TypeScript using helper functions (`pgTable`, `varchar`, `uuid`, `timestamp`, etc.). There is no separate schema language, no `.prisma` file, no DSL to learn. This is consistent with the project's TypeScript-first posture: a module developer writes their table schema in the same language and with the same tooling as the rest of their code.

```typescript
// src/modules/blog/data/schema.ts — a module-owned schema file
import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  body: text('body').notNull(),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

This schema file is owned entirely by the module. It imports from `drizzle-orm/pg-core` — a pure type/utility import with no connection concern. The connection comes from the `db` client exported by `@/socle-plus/database`.

### No code generation step

Prisma requires running `prisma generate` before TypeScript can compile, because the TypeScript types for the Prisma client are generated artifacts. This means:
- CI pipelines must run `prisma generate` before `tsc`
- Developers who `git pull` must regenerate before their editor recognizes new types
- The generated client adds ~300 KB to the bundle

Drizzle has no generation step. Types are inferred directly from the schema definitions at compile time. `tsc`, `vitest`, and the dev server all work immediately after `npm install`.

### `exactOptionalPropertyTypes` compatibility

Prisma's generated client has known friction with `exactOptionalPropertyTypes: true`. Fields typed as optional in Prisma's generated output sometimes use `T | undefined` in ways that conflict with this setting, requiring workarounds or type assertions. Drizzle's TypeScript-native approach has no such friction — types flow from the schema definitions through to query results without a generation boundary.

### Thin abstraction layer

Drizzle's query builder stays close to SQL. There is no "virtual relation" system that hides what queries are actually executed. Complex queries are written as SQL that is readable and predictable:

```typescript
const result = await db
  .select({ id: posts.id, title: posts.title })
  .from(posts)
  .where(eq(posts.published, true))
  .orderBy(desc(posts.createdAt))
  .limit(10)
```

This predictability matters for performance review: there is no hidden N+1 risk from a virtual relation being accidentally traversed. Developers can reason about query cost by reading the query builder call.

### Bundle size and serverless compatibility

Drizzle adds approximately 40 KB to the production bundle. The generated Prisma client adds approximately 300 KB. For a Next.js application deployed to serverless functions (Vercel, etc.), this matters for cold-start performance. Drizzle also works without modification in Next.js Edge Runtime and Cloudflare Workers if needed — the Prisma client does not without additional configuration.

### `drizzle-kit` for migrations

`drizzle-kit` generates SQL migration files from the difference between the current schema and the last applied migration. Migration files are plain SQL stored in the module's `migrations/` directory, making them readable and reviewable in code review without any tool knowledge. The Socle+ migration runner reads these SQL files and applies them in order.

---

## Alternatives Considered

### Prisma

Prisma is the most widely used TypeScript ORM and has excellent tooling, including `prisma studio` (a local database browser), first-class migration history management, and extensive ecosystem documentation.

**Why not chosen:**

- Requires a code-generation step (`prisma generate`) before TypeScript compiles. This adds friction to CI pipelines and local development, particularly for a multi-module architecture where schemas are distributed across modules.
- The generated Prisma client is a single, centralized artifact. This conflicts with the BSCore module model where each module owns its own schema. With Prisma, all schemas must live in one `.prisma` file or be merged — there is no per-module schema file that maps cleanly to the module boundary.
- Known friction with `exactOptionalPropertyTypes: true`.
- Bundle size (~300 KB) is a meaningful cost for serverless deployments.
- `prisma studio` is useful in development but not a production requirement, and does not justify the above trade-offs.

Prisma remains a viable choice and is not ruled out for a future BSCore variant with different constraints. For V1, the code-generation requirement and schema centralization conflict with the module architecture.

### Raw SQL only (no ORM or query builder)

Writing all database interactions as raw parameterized SQL using the `postgres` package directly, with no abstraction layer.

**Why not chosen:**

- No TypeScript type inference from schema. Query results are typed as `unknown` or require manual casting, defeating the strict typing goals of the project.
- No migration tooling. Migrations would need to be managed manually or with a separate lightweight tool (e.g., `node-pg-migrate`), adding an additional dependency and process.
- Module developers would write SQL strings directly, creating inconsistency across modules and making schema changes harder to trace.
- The productivity cost for routine queries (inserts, updates, filtered selects) is high without proportional benefit at this scale.

Raw SQL remains appropriate for complex queries that the Drizzle query builder cannot express cleanly. Drizzle supports inline SQL via its `sql` template tag for these cases. The default is the query builder; raw SQL is the escape hatch.

### Supabase client only (`@supabase/supabase-js`)

Using the Supabase JavaScript client's built-in query builder (`.from('table').select()`) for all database interactions, with no separate ORM.

**Why not chosen:**

- The Supabase client query builder is not typed from schema definitions. It accepts table names as strings and returns loosely typed results. Achieving strict typing requires additional type annotation that duplicates schema information.
- It is designed for use with Supabase's Row Level Security model, where the client operates under a user's JWT and RLS policies filter the result. Socle+ uses the Supabase client for auth only; application data queries run via Drizzle with a direct PostgreSQL connection, which is the correct separation.
- Coupling the application's data access layer to the Supabase client creates a dependency on Supabase's specific API conventions across all modules. If the database host ever changes, every repository in every module would need to be rewritten.
- No migration tooling. Schema changes would need to be managed through Supabase's dashboard or a separate tool.

The Supabase client is used in Socle+ for one purpose only: reading and validating auth sessions via `supabase.auth.getUser()`. It is not used for data queries.

---

## Consequences

### On Socle

No consequences. Socle has zero database imports and this decision does not change that. Drizzle must never appear in any file under `src/socle/`. If a CI check or lint rule detects a `drizzle-orm` import in `src/socle/`, it is a bug.

### On Socle+

- `src/socle-plus/database/` creates the Drizzle client using the `postgres` package and the `DATABASE_URL` environment variable.
- The `db` instance is exported from `@/socle-plus/database` and is the only database connection in the entire application.
- `src/socle-plus/` defines its own Drizzle schemas for its tables (`user_roles`, `audit_events`) in schema files alongside each subdirectory.
- `drizzle-kit` is configured to discover schema files across `src/socle-plus/` and all active `src/modules/` directories for migration generation.

### On modules and migrations

Each module that uses a database follows this pattern:

1. **Schema file** — defines Drizzle table schemas in `src/modules/[name]/data/schema.ts`. Imports from `drizzle-orm/pg-core` only — no connection import.
2. **Repository** — implements data access functions in `src/modules/[name]/data/[name]-repository.ts`. Imports `db` from `@/socle-plus/database` and the module's own schema file.
3. **Migrations** — SQL files generated by `drizzle-kit diff` and stored in `src/modules/[name]/data/migrations/`. Discovered and applied by the Socle+ migration runner at startup.

Modules may import from `drizzle-orm` for schema primitives and query helpers. Modules must not import from `postgres` or `@supabase/supabase-js`. The `db` connection object comes exclusively from `@/socle-plus/database`.

### On development workflow

- `npm install` is sufficient. No post-install generation step required.
- Schema changes: edit the TypeScript schema file, run `drizzle-kit generate` to produce the SQL migration file, commit both.
- Migration application: handled automatically by the Socle+ migration runner at application startup.
- There is no `prisma studio`. Database inspection during development uses standard PostgreSQL tools (psql, TablePlus, Supabase dashboard).

### On testing

- Integration tests use a dedicated PostgreSQL test database. Drizzle uses the same API against the test database — no mocking, no adapter swap.
- The `db` client exported by `@/socle-plus/database` can be pointed at the test database by setting `DATABASE_URL` in the test environment. No test-specific configuration is needed in module repositories.

---

## Trade-offs

| Trade-off | Assessment |
|---|---|
| No `prisma studio` | Acceptable — Supabase dashboard and standard PostgreSQL tools cover inspection needs |
| `drizzle-kit` migration DX is less polished than `prisma migrate` | Acceptable — SQL migration files are readable and the workflow is straightforward |
| Drizzle requires more explicit query writing than Prisma's relation model | Acceptable — explicit queries are predictable; hidden N+1s are worse than verbosity |
| Drizzle ecosystem is smaller than Prisma's | Low risk — Drizzle is mature and actively maintained; BSCore's needs are standard |
| Module developers must learn Drizzle's query builder API | Low cost — the API surface used in repositories is small and consistent |

---

## Risks to Revisit

**`drizzle-kit` migration discovery across distributed schema files.** The migration runner must correctly discover schema files from both `src/socle-plus/` and all active `src/modules/`. The `drizzle-kit` configuration for this must be tested with at least two modules before being considered stable.

**Cross-module schema references.** Drizzle can express foreign key relationships between tables defined in different schema files. Modules must not define foreign keys into other modules' tables (this would violate module boundary rules). The boundary rule — modules own their tables and no other module references them directly — must be enforced in code review, as Drizzle cannot enforce it statically.

**Migration ordering across modules.** When two modules both have pending migrations, their relative application order is determined by the migration runner's discovery and ordering logic. This must be deterministic and well-documented. Any migration that references another module's table (which should only happen for Socle+ tables, not module-to-module) must have correct ordering enforced by timestamp prefix conventions.

**Drizzle major version changes.** Drizzle ORM is still pre-1.0 at time of writing. API stability between minor versions has been good, but a future major version may introduce breaking changes to the query builder or schema definition API. The abstraction layer (`src/socle-plus/database/`) provides some insulation, but module schema files that import `drizzle-orm/pg-core` directly would need updating in a breaking version change.

---

## Summary

| Aspect | Decision |
|---|---|
| ORM / query builder | Drizzle ORM |
| Migration tooling | `drizzle-kit` |
| PostgreSQL driver | `postgres` (node-postgres) |
| Connection ownership | `src/socle-plus/database/` — one `db` instance for the entire application |
| Schema ownership | Each module defines its own schema in `src/modules/[name]/data/schema.ts` |
| Module DB access | Imports `db` from `@/socle-plus/database`; never creates its own connection |
| Socle impact | None — Socle remains completely database-free |
| Code generation required | No |
| Supabase client role | Auth only (`supabase.auth.getUser()`); not used for data queries |
