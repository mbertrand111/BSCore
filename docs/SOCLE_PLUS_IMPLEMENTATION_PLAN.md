# SOCLE+ — Implementation Plan

This document is the implementation reference for Socle+. It captures every architectural decision made during planning so that implementation proceeds without re-debating resolved questions.

**Relationship to other docs:**
- `docs/SOCLE_PLUS.md` defines what belongs in Socle+ and what does not. Read it first.
- `docs/BOUNDARIES.md` governs all layer separation rules.
- `docs/SECURITY_RULES.md` governs all security requirements.
- This document defines **how** Socle+ is built — order, schema, contracts, and constraints.

---

## Prerequisite: ADR-0002 (ORM Choice)

**This must be resolved before writing any implementation code.**

`docs/ADR/0001-tech-stack.md` explicitly defers the ORM choice to "Socle+ database layer implementation." That moment has arrived. The decision must be recorded in `docs/ADR/0002-orm-choice.md` before Step 1 begins.

**Recommendation: Drizzle ORM.**

| Criterion | Drizzle ORM | Prisma |
|---|---|---|
| Schema definition | TypeScript | `.prisma` DSL (code-generation step required) |
| Migration tooling | `drizzle-kit` — mature | `prisma migrate` — best-in-class |
| Bundle size | ~40 KB | ~300 KB (generated client) |
| Edge / serverless | Yes — no generated client | Requires Prisma Accelerate |
| Type inference | Excellent, native TypeScript | Excellent, generated types |
| `exactOptionalPropertyTypes` | No known issues | Known friction with generated types |
| Supabase compatibility | Full — uses standard PG connection string | Full |

Drizzle is recommended because it has no code-generation step, a smaller bundle, TypeScript-native schema definitions (consistent with the project's TypeScript-first posture), no friction with `exactOptionalPropertyTypes`, and works cleanly in Next.js App Router server components and edge contexts.

Any deviation from this recommendation must be recorded in ADR-0002 before implementation.

---

## 1. Implementation Order

Steps must be followed in order. Each step's deliverables are prerequisites for the next.

| Step | Deliverable | Depends on |
|---|---|---|
| ADR-0002 | ORM decision confirmed | — |
| 1 | Database connection layer (Drizzle + Supabase client factory) | ADR-0002 |
| 2 | Migration runner | Step 1 |
| 3 | `user_roles` schema + migration | Step 2 |
| 4 | Authentication lifecycle (Supabase Auth integration) | Step 3 |
| 5 | Authorization — RBAC engine (`can()`, `requireRole()`) | Step 4 |
| 6 | RequestContext typed accessors | Steps 4, 5 |
| 7 | Admin shell (layout, nav registry, auth guard) | Steps 5, 6 |
| 8 | Audit log service | Steps 3, 4 |
| 9 | Socle+ public interface (`index.ts`) | All steps |

### Why this order

- Nothing in Socle+ can run without a database connection (Step 1).
- Migrations must exist before any schema is created (Step 2 before Step 3).
- Authentication requires a place to store role data (Step 3 before Step 4).
- Authorization requires a resolved user identity (Step 4 before Step 5).
- The admin shell requires both auth and authorization (Steps 5–6 before Step 7).
- Audit logging requires the user model and auth events to be defined (Steps 3–4 before Step 8).
- The public interface is assembled last, after all internal contracts are stable (Step 9).

---

## 2. Database Strategy

### Two clients, one layer

Socle+ uses two database clients with distinct responsibilities. Both live in `src/socle-plus/` and are never imported directly by modules or Socle.

| Client | Package | Responsibility | Location |
|---|---|---|---|
| `db` (Drizzle) | `drizzle-orm` + `postgres` | All app-level table queries (roles, audit log, module data) | `src/socle-plus/database/` |
| `createSupabaseServerClient()` | `@supabase/ssr` | Auth session reading and JWT validation | `src/socle-plus/auth/` |

The Supabase server client factory belongs in `auth/` — not `database/` — because it has no role in app-level data querying. It exists solely to validate auth sessions. Keeping it there preserves a clean boundary: `database/` is the Drizzle layer, `auth/` is the Supabase Auth layer.

### Supabase as infrastructure

Supabase is the managed PostgreSQL host. BSCore owns all application schema and all business logic. Supabase is not used as an application platform — it provides the database and the auth service, nothing more.

Row Level Security (RLS) policies on app tables are an additional safety layer, not a replacement for application-level authorization checks. Authorization is enforced in application code first.

### Environment variables

These variables are accessed only through `getEnv()` from `@/socle/config/env` — never via `process.env` directly in Socle+ files.

```
DATABASE_URL=         # Required — direct PostgreSQL connection string for Drizzle
SUPABASE_URL=         # Required — Supabase project URL
SUPABASE_ANON_KEY=    # Required — public anon key (used for server-side session reading)
SUPABASE_SERVICE_KEY= # Conditionally required — only when admin user operations are needed
```

`DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` are required for any Socle+ activation. `SUPABASE_SERVICE_KEY` is the service role key that bypasses Row Level Security — it is only required for specific server-side admin operations such as creating the first super admin user or modifying a user's Supabase Auth record. It must not be provided in environments where these operations will not run, and must not be loaded at startup unless the operation that needs it is about to execute.

### Modules and the database

Modules access the database by importing `db` from `@/socle-plus/database`. They never:
- Create their own database connections
- Import the PostgreSQL client (`postgres` package) directly
- Import `@supabase/supabase-js` directly
- Read `DATABASE_URL` themselves

Modules do use Drizzle schema primitives (`pgTable`, `varchar`, `uuid`, etc.) to define their own table schemas and write their repositories. This is expected — Drizzle primitives are type definitions, not a connection. The connection always comes from the `db` instance exported by `@/socle-plus/database`.

### Migrations

Each module owns its migrations under `src/modules/[name]/data/migrations/`. Socle+ owns its own migrations under `src/socle-plus/*/migrations/`. The migration runner (Step 2) discovers and applies all pending migrations in deterministic order.

Migration file naming: timestamp-prefixed for deterministic ordering (e.g., `001_create_user_roles.ts`).

### Test database

Integration tests run against a dedicated PostgreSQL test database, never the development or production database. It is seeded fresh per test run.

---

## 3. Authentication Model

### Supabase Auth is the authentication provider

Custom authentication — password hashing, session token generation, custom brute-force tracking — is not implemented in Socle+. Supabase Auth handles:

- Password hashing (bcrypt, managed internally)
- Session token generation, signing, and rotation (JWT)
- Token refresh lifecycle
- Rate-limiting on failed login attempts (configurable in Supabase Auth settings)
- Email verification and password reset flows
- Session expiry and invalidation

These are configuration concerns in the Supabase project dashboard, not implementation concerns in BSCore.

### What Socle+ implements

**Supabase server client factory** (`src/socle-plus/auth/supabase-client.ts`):

```typescript
createSupabaseServerClient(cookieStore: ReadonlyRequestCookies): SupabaseClient
```

A thin wrapper around `@supabase/ssr`'s `createServerClient`. Receives cookies as a parameter (never reads them via `next/headers` internally — this keeps the factory testable and framework-agnostic at the unit level).

**User resolution** (`src/socle-plus/auth/resolve-user.ts`):

```typescript
resolveUser(supabase: SupabaseClient): Promise<AuthenticatedUser | null>
```

Execution path:
1. Calls `supabase.auth.getUser()` — validates the JWT against Supabase's server, never trusts the cookie claim alone
2. If no valid session: returns `null`
3. Queries `user_roles` via Drizzle using the Supabase `user.id`
4. If no `user_roles` row: returns `null` — the user exists in Supabase but has no app role, treated as unauthenticated for admin purposes
5. Assembles and returns `AuthenticatedUser`

**Auth middleware** (`src/socle-plus/auth/auth-middleware.ts`):

A `MiddlewareFunction` compatible with Socle's pipeline. It:
1. Reads cookies from `ctx.meta['socle.request.cookies']` (populated by the Next.js adapter — see Section 6)
2. Creates the Supabase server client
3. Calls `resolveUser()`
4. On success: writes `ctx.meta['socle.user']` and `ctx.meta['socle.session']` (expiry timestamp only)
5. On failure: writes nothing — `requireRole()` or `requireAuth()` middleware handles rejection downstream

### Edge Runtime constraint

`src/middleware.ts` runs in Next.js's Edge Runtime. The Edge Runtime does not have access to Node.js APIs — `drizzle-orm`, the `postgres` driver, and any code that opens a TCP socket to PostgreSQL cannot run there.

**`authMiddleware` must never be used in `src/middleware.ts`.** Role resolution calls `getUserRole()`, which executes a Drizzle query. This is Node.js–only.

The Edge Middleware (`src/middleware.ts`) is responsible for three things only:
- Supabase session **cookie refresh** (HTTP call to Supabase — Edge-compatible)
- Baseline **security headers** (`X-Frame-Options`, `X-Content-Type-Options`, etc.)
- **`x-request-id`** propagation for end-to-end tracing

`ctx.meta['socle.user']` is therefore **never globally pre-populated** by `middleware.ts`. Every protected server context is individually responsible for resolving the user:

| Context | How to get the authenticated user |
|---|---|
| Admin layouts (RSC) | `requireAdminAuth()` from `@/socle-plus/admin` |
| Module Route Handlers / Server Actions | `requireAuthUser(ctx)` or `can(user, action, resource)` from `@/socle-plus` |

Module authors must not assume `ctx.meta['socle.user']` exists without explicitly resolving it in their own handler or action.

### Critical: `getUser()` not `getSession()`

The auth middleware and any server-side auth check must call `supabase.auth.getUser()`, not `supabase.auth.getSession()`.

`getSession()` returns the cached cookie value without re-validating the JWT against Supabase's server. `getUser()` makes a network call to Supabase to verify the token has not been revoked. For all admin-panel authorization, the stronger guarantee is required. This distinction must be enforced in code review.

### Login and logout flows

Socle+ provides server-side action helpers so that each project does not reimplement the same Supabase call logic:

```typescript
signIn(email: string, password: string): Promise<{ error: string | null }>
signOut(): Promise<void>
```

These helpers call `supabase.auth.signInWithPassword()` and `supabase.auth.signOut()` respectively. They contain no business logic and are the only sanctioned way to trigger an auth state change from the application. Project route handlers call these helpers — they never call the Supabase client directly.

The **UI and routing** (login page, logout button, post-login redirect) are project-level concerns in `src/app/(auth)/` and `src/client/`. Socle+ does not provide a login page component, a logout button, or password reset UI.

### Cookie security

`@supabase/ssr` sets `httpOnly`, `secure`, and `sameSite` on auth cookies automatically. Socle+ must not override these attributes. The `nextResponseWithHeaders()` function in Socle's Next.js adapter applies security headers to the response but must not interfere with cookie attributes.

---

## 4. User Model

### What Supabase owns

Supabase manages the canonical user record in its internal `auth.users` table. This table is not directly accessible via Drizzle and is not mirrored in the application schema.

### What Socle+ owns: `user_roles`

Socle+ stores only the application-level extension of a Supabase user — the role assignment.

```
Table: user_roles
  id          UUID         PRIMARY KEY, DEFAULT gen_random_uuid()
  user_id     UUID         NOT NULL UNIQUE
                           REFERENCES auth.users(id) ON DELETE CASCADE
  role        VARCHAR(50)  NOT NULL CHECK (role IN ('admin', 'super_admin'))
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
```

`ON DELETE CASCADE` ensures that when a user is deleted from Supabase Auth, their role row is automatically removed.

### Supabase user ID mapping

`user_roles.user_id` is the Supabase Auth UUID (`auth.users.id`). When the auth middleware reads the Supabase session, it extracts `session.user.id` and queries `user_roles` by that ID to resolve the role. No other Supabase user fields (email, etc.) are stored in `user_roles` — they are read from the live Supabase session when needed.

### The `AuthenticatedUser` type

This type is assembled at middleware time from two sources (Supabase session + `user_roles` query) and stored in `ctx.meta['socle.user']`. Downstream code never needs to know the assembly origin.

```typescript
type UserRole = 'admin' | 'super_admin'

type AuthenticatedUser = {
  id: string      // Supabase Auth UUID
  email: string   // from Supabase session (auth.users.email)
  role: UserRole  // from user_roles table (app DB)
}
```

This type is exported from `@/socle-plus/auth` as part of the public interface.

### What is NOT in the user model

No profile fields. No `name`, `avatar`, `phone`, `preferences`. Email is the only personal data carried in `AuthenticatedUser`, and it originates from the Supabase session — it is not stored in `user_roles`.

Extended user attributes (display name, avatar, contact fields) belong in Module: User Profile.

### V1 role model

A single role per user (not an array). The `UNIQUE` constraint on `user_roles.user_id` enforces this. Two roles exist: `'admin'` and `'super_admin'`.

- `super_admin` — full access to all resources, including user management, role changes, and the audit log
- `admin` — access to resources declared by each active module for this role

Module-specific role names (e.g., `'editor'`, `'moderator'`) are not defined in Socle+. Modules declare permissions for the roles Socle+ defines.

---

## 5. Authorization Model

### RBAC architecture

Socle+ defines the role concept. Modules declare which actions are permitted for each role on their resources.

**Permission declaration** (called by modules at activation):

```typescript
declarePermissions(resource: string, permissions: Partial<Record<UserRole, Action[]>>): void
```

Example call from the Blog module's `register()` function:

```typescript
declarePermissions('posts', {
  admin: ['read', 'create', 'update', 'delete'],
  super_admin: ['manage'],
})
```

**The `can()` interface:**

```typescript
type Action = 'read' | 'create' | 'update' | 'delete' | 'manage'

can(user: AuthenticatedUser, action: Action, resource: string): boolean
```

Evaluation rules:
- `super_admin` always returns `true` for any action on any resource
- `admin` returns `true` only if the action is declared in `declarePermissions()` for `'admin'` on that resource
- Any unauthenticated call always returns `false`

**Authorization middleware:**

```typescript
requireRole(minimumRole: UserRole): MiddlewareFunction
requireAuth(): MiddlewareFunction  // alias for requireRole('admin')
```

Both read `ctx.meta['socle.user']` (written by auth middleware). `requireAuth()` throws `UnauthorizedError` if no user is present. `requireRole()` additionally throws `ForbiddenError` if the user's role is insufficient.

Authorization checks happen server-side on every protected request. Client-supplied role claims are never trusted.

### Integration with `RequestContext`

Auth middleware runs first in the pipeline and populates `ctx.meta['socle.user']`. Authorization middleware runs after and reads it. This ordering is enforced by explicit composition in each protected server context (admin layouts, module Route Handlers) — not by a global Next.js middleware. See the **Edge Runtime constraint** note in Section 3 for why this cannot happen in `src/middleware.ts`.

---

## 6. RequestContext Integration

### Meta key conventions

Meta keys starting with `socle.` are reserved for Socle+ use. Module middleware must not write to keys in this namespace. Modules use their own prefix:

```typescript
// Correct — module-owned key
ctx.meta['blog.currentPost'] = post

// Forbidden — reserved namespace
ctx.meta['socle.user'] = something
```

### Keys written by Socle+ auth middleware

| Key | Type | Written by | Content |
|---|---|---|---|
| `socle.user` | `AuthenticatedUser \| undefined` | Auth middleware (Node.js only) | Assembled from Supabase session + `user_roles`; **never written by `src/middleware.ts`** |
| `socle.session` | `{ expiresAt: Date } \| undefined` | Auth middleware (Node.js only) | Expiry timestamp from the Supabase JWT |
| `socle.request.cookies` | `ReadonlyRequestCookies` | Next.js adapter | Cookies from `NextRequest`, populated before the pipeline runs |

`socle.session` carries only the expiry timestamp surfaced from the Supabase JWT. The full session lifecycle (refresh, invalidation) is managed by Supabase and does not need further representation in `RequestContext`.

### Typed accessor API

These are the only sanctioned way to read auth state from context. Direct `ctx.meta['socle.*']` access outside of Socle+ is forbidden.

```typescript
getAuthUser(ctx: RequestContext): AuthenticatedUser | null
requireAuthUser(ctx: RequestContext): AuthenticatedUser  // throws UnauthorizedError if absent
getSession(ctx: RequestContext): { expiresAt: Date } | null
```

Exported from `@/socle-plus/auth` as part of the public interface.

### Next.js adapter extension

The Socle Next.js adapter (`src/socle/middleware/next-adapter.ts`) must be extended to populate `ctx.meta['socle.request.cookies']` from `NextRequest.cookies` before the pipeline runs. This is the correct layer for cookie extraction because cookie access is environment-specific. The auth middleware consumes cookies via the meta bag — no Socle types are modified.

---

## 7. Admin Shell Foundation

### What Socle+ provides

**Nav registry:**

```typescript
type AdminNavItem = {
  label: string
  href: string
  icon?: string
  requiredRole: UserRole
}

registerAdminNav(item: AdminNavItem): void
getAdminNav(user: AuthenticatedUser): AdminNavItem[]
```

Modules call `registerAdminNav()` during their `register()` call at activation. `getAdminNav()` returns only items the current user's role can access.

**React Server Components (Next.js):**

| Component | Type | Responsibility |
|---|---|---|
| `AdminLayout` | Server Component | Outer shell: header + sidebar + content area |
| `AdminHeader` | Hybrid | Logo, user info — `'use client'` only for interactive parts (nav toggle, user menu) |
| `AdminSidebar` | Server Component | Renders nav items from the registry, filtered by user role |

**Server-side auth guard:**

```typescript
requireAdminAuth(): Promise<AuthenticatedUser>
```

A server-only function. Reads the session cookie, calls `resolveUser()`, and redirects to `/login` if the user is not authenticated or has no role. Called at the top of `src/app/admin/layout.tsx`.

**Integration point** (`src/app/admin/layout.tsx`):

```typescript
import { requireAdminAuth } from '@/socle-plus/admin'
import { AdminLayout } from '@/socle-plus/admin'

export default async function Layout({ children }) {
  const user = await requireAdminAuth()
  return <AdminLayout user={user}>{children}</AdminLayout>
}
```

`src/app/admin/` is routing and layout only. All logic lives in `src/socle-plus/admin/`.

### What the admin shell does NOT provide

- Dashboard content or analytics widgets
- Any CRUD interface for any domain entity
- File browser or media management
- User management UI — that belongs to Module: User Profile's admin section
- Any auto-generated admin for module data
- Any knowledge of posts, products, bookings, or any business concept

The shell is a container that renders what modules register and provide. Its content area is `{children}` from the Next.js nested layout. Module admin sections are independent pages under `src/app/admin/[module-path]/`.

### Server / client component boundary

`requireAdminAuth()` must run in a server context — it reads cookies. Components that call it or import it must not be marked `'use client'`. The `'use client'` boundary in the admin shell is limited to interactive sub-components (mobile nav toggle, dropdown menus). This split must be planned explicitly per component to prevent hydration errors.

---

## 8. Audit Logging

### What Supabase handles

Authentication events — login, logout, failed login, password reset, email verification — are recorded by Supabase Auth in its internal logs. Socle+ does not duplicate these.

Capturing Supabase auth events into the application audit log (via Supabase Auth webhooks) is deferred to post-V1. It requires a publicly accessible webhook endpoint and is a project-level integration concern, not a Socle+ responsibility.

### What Socle+ logs

The application audit log covers events that Supabase cannot know about — app-level decisions:

| Event constant | Trigger |
|---|---|
| `AUDIT_EVENTS.USER_ROLE_ASSIGNED` | A super_admin grants a role to a user |
| `AUDIT_EVENTS.USER_ROLE_CHANGED` | A super_admin changes a user's existing role |
| `AUDIT_EVENTS.USER_ROLE_REVOKED` | Role row deleted — user loses admin access |
| `AUDIT_EVENTS.ADMIN_ACTION` | Generic admin mutation (used by modules for significant actions) |

`writeAuditEvent()` is never called from auth middleware. It is called explicitly from admin action handlers when a role or access decision is recorded.

### Schema

```
Table: audit_events
  id          UUID         PRIMARY KEY, DEFAULT gen_random_uuid()
  event       TEXT         NOT NULL
  user_id     UUID         NULLABLE  (references auth.users — intentionally NOT a hard FK)
  actor_id    UUID         NULLABLE  (the admin who performed the action, if different from user_id)
  meta        JSONB        non-sensitive context: changed fields, resource ID, etc.
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
```

`user_id` is intentionally not a hard foreign key to `auth.users`. Audit records must survive user deletion for compliance purposes. When a user is removed from Supabase Auth, their audit history is retained with the original UUID. The `user_roles` table uses `ON DELETE CASCADE` (role has no meaning without the user); the audit table does not.

### Public service

```typescript
writeAuditEvent(event: string, options: AuditEventOptions): Promise<void>
```

Exported from `@/socle-plus/audit`. Called by admin action handlers in Socle+ and, optionally, by module admin sections for significant events (via `AUDIT_EVENTS.ADMIN_ACTION`).

Read access to the audit log requires `super_admin` role.

---

## 9. Boundaries

### Socle owns

- Request pipeline (`createPipeline`, `MiddlewareFunction`, `RequestContext`)
- Error types (`AppError`, `toAppError`, `toSafeError`)
- Logger interface (`Logger`, `createLogger`, `logger`)
- Security headers (`SECURITY_HEADERS`, `nextResponseWithHeaders`)
- `getEnv()` — the only `process.env` access point in the entire project
- Next.js adapter (`contextFromNextRequest`, extended to populate `socle.request.cookies`)

Socle has zero database imports and zero auth imports. This is a structural rule, not a convention.

### Socle+ owns

- Database client (`db` via Drizzle, exported from `@/socle-plus/database`)
- Supabase server client factory (`createSupabaseServerClient`, in `@/socle-plus/auth`)
- Migration runner
- `user_roles` table schema and migration
- `audit_events` table schema and migration
- `AuthenticatedUser` and `UserRole` types
- `resolveUser()` and auth middleware
- `can()`, `requireRole()`, `requireAuth()`
- Typed context accessors (`getAuthUser()`, `requireAuthUser()`, `getSession()`)
- Admin shell layout, nav registry, `requireAdminAuth()`
- `writeAuditEvent()` and `AUDIT_EVENTS` constants
- `declarePermissions()` — called by modules at activation
- `runMigrations()` — migration runner entry point

### Modules own

- Domain entities (posts, products, bookings, forms — none of these exist in Socle+)
- CRUD for their entities
- Their own database migrations (`src/modules/[name]/data/migrations/`)
- Their admin section React components
- Registration of nav items into Socle+'s registry via `registerAdminNav()`
- Declaration of permissions via `declarePermissions()`
- Extended user attributes (Module: User Profile)
- Social authentication (Module: Social Auth)
- Two-factor authentication (Module: 2FA)

### Client code owns

- Client-specific module extensions
- Project-specific third-party integrations
- Project theme, brand identity, and CSS variables
- Login/logout page UI and routing (calls Socle+ `signIn()` / `signOut()` helpers — never the Supabase client directly)
- Bespoke business rules that cannot be expressed through module extension points

### Concrete boundary examples

| What | Where | Why |
|---|---|---|
| `db` Drizzle client | `src/socle-plus/database/` | Infrastructure — all app DB access goes through this |
| Supabase server client factory | `src/socle-plus/auth/` | Auth infrastructure — isolated from database layer |
| `user_roles` schema | `src/socle-plus/auth/migrations/` | App-level auth extension — owned by Socle+ |
| `audit_events` schema | `src/socle-plus/audit/migrations/` | Infrastructure event log — owned by Socle+ |
| `can()` function | `src/socle-plus/authorization/` | RBAC infrastructure — no domain knowledge |
| Admin shell layout | `src/socle-plus/admin/` | Infrastructure container — no domain content |
| Blog post CRUD | `src/modules/blog/` | Domain feature — not infrastructure |
| User display name | `src/modules/user-profile/` | Profile data — not minimal auth infrastructure |
| Login page UI | `src/app/(auth)/login/` | Project-level routing — not a Socle+ concern |
| Role "editor" | Module: Blog (declaration via `declarePermissions`) | Role semantics are module-defined |

---

## 10. Security Considerations

### Authentication security (Supabase's responsibility)

Supabase Auth handles password hashing, session token design, JWT signing, token rotation, and rate-limiting on failed attempts. These are not implementation concerns for BSCore. They are configured in the Supabase Auth project settings.

### Application security (Socle+'s responsibility)

**`getUser()` not `getSession()`**

Every server-side auth check must call `supabase.auth.getUser()`, not `supabase.auth.getSession()`. `getSession()` trusts the cookie value without re-validating the JWT. `getUser()` validates against Supabase's server, confirming the token has not been revoked. This distinction must be enforced in code review for every admin-facing route.

**Role enforcement is application code**

Supabase Auth has no awareness of `user_roles`. All RBAC decisions are Socle+'s sole responsibility. Supabase RLS policies on app tables are an additional safety layer — they are not a substitute for application-level authorization checks. `can()` and `requireRole()` must never be bypassed on the assumption that RLS will protect the data.

**`SUPABASE_SERVICE_KEY` isolation**

The service role key bypasses Row Level Security and is not required for normal Socle+ operation. It is loaded on demand only in the specific server-side functions that need it (admin user management operations). Files that use it must import `'server-only'` to cause a build-time error if ever imported by a client component. The service key must never appear in logs, error messages, or API responses.

**CSRF protection**

Admin state-changing requests use Next.js server actions, which include built-in CSRF token protection. Plain API route handlers that accept cookie-authenticated requests must verify the `Origin` or `Referer` header as an additional CSRF check.

**Cookie integrity**

`@supabase/ssr` sets `httpOnly`, `secure`, and `sameSite=lax` on auth cookies automatically. Socle+'s Next.js adapter must not override these attributes when applying security headers to the response.

**`user_roles` row absence**

A user can exist in `auth.users` (e.g., they signed up via Supabase's email flow) with no corresponding row in `user_roles`. This is the correct state for non-admin users. `resolveUser()` returns `null` in this case, and the admin shell redirects to login. This case must be explicitly handled in `resolveUser()` — it must not fall through to a partial `AuthenticatedUser` with an undefined role.

---

## 11. Risks and Trade-offs

### Deferred decisions (must resolve before the relevant step)

| Decision | Resolve before | Notes |
|---|---|---|
| ORM choice | Step 1 | ADR-0002 required — Drizzle recommended above |
| CSRF mechanism for plain API routes | Step 4 | Server actions have built-in CSRF; `route.ts` handlers that use cookies require `Origin` header validation |
| Supabase Auth webhook for audit log | Post-V1 | Capturing login/logout in the app audit log requires a Supabase Auth hook — defer until a project requires it |

### Known limitations and future concerns

**Single role per user (V1)**

`user_roles` has a `UNIQUE` constraint on `user_id`. A user has exactly one role. Multi-role or permission-set models are not designed in. If a module requires finer-grained permission control, the `can()` interface signature is stable — only the internal evaluation logic would need to expand. This is a deliberate V1 simplification.

**Multi-tenancy not designed in**

`user_roles` and `audit_events` have no `tenant_id` column. Adding multi-tenancy later requires a migration and a review of every query. Flagged as a known future concern per `docs/SOCLE_PLUS.md` Section 2.7.

**`RequestContext.meta` type safety**

The `meta` bag is `Record<string, unknown>`. The typed accessor functions (`getAuthUser()`, etc.) are the mitigation. Downstream code that reads `ctx.meta['socle.*']` directly instead of using the accessors will receive `unknown` and must cast — this is both error-prone and a boundary violation. Enforcing accessor-only access via an ESLint rule is flagged in ADR-0001 as deferred and should be implemented alongside Socle+.

**Supabase dependency**

Wrapping the Supabase server client in `createSupabaseServerClient()` provides one layer of indirection, but modules that use `getAuthUser()` receive an `AuthenticatedUser` type that has no Supabase-specific fields. If the auth provider ever changes, only `src/socle-plus/auth/` needs to change — the `AuthenticatedUser` contract and all consumers remain stable.

**Boot activation mechanism**

The Next.js App Router has no traditional application startup hook. Socle+ initialization (`runMigrations()`, module `register()` calls) must be triggered via a server-only bootstrap file imported in `src/app/layout.tsx`. The exact mechanism must be designed before Step 7 (admin shell) and explicitly documented when implemented.

---

## 12. Open Questions

These are unresolved questions that must be answered before or during the relevant step. They must not be resolved by implicit implementation choices.

**OQ-1 — ADR-0002: ORM choice**
Must be confirmed as a formal ADR before Step 1. Drizzle is recommended; any deviation requires documented rationale.

**OQ-2 — Boot activation mechanism**
How does Socle+'s `initialize()` and each module's `register()` get called at Next.js startup? Likely approach: a server-only `bootstrap.ts` imported in `src/app/layout.tsx` using `import 'server-only'`. This must be explicitly designed and documented before Step 7.

**OQ-3 — Health endpoint**
The Socle `/health` endpoint does not yet exist. Step 1 adds `checkDatabaseHealth()` to Socle+. The base `/health` route should be implemented as a Socle concern before Socle+ begins, so the database health check can extend it cleanly.

**OQ-4 — Supabase Auth webhook for audit log**
Should Supabase login/logout events be captured in the application audit log via a Supabase Auth webhook? Recommendation: defer to post-V1. Implementing the webhook requires a publicly accessible endpoint and is a deployment-level concern. V1 audit log covers role changes and admin actions.
