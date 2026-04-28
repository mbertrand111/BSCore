# FRONTEND — BSCore Front Cadrage

This document defines the rules, structure, and contracts for all front-end work in BSCore. It is read **before** implementing any UI, page, or admin section. It is the front-end counterpart to `ENGINEERING_RULES.md` and `BOUNDARIES.md`.

**Read order:**
1. `docs/ARCHITECTURE.md` — layer model
2. `docs/BOUNDARIES.md` — what cannot cross what
3. `docs/UX_RULES.md` — UX requirements (states, accessibility, feedback)
4. This document

If a rule below conflicts with one of those, the more restrictive rule wins.

---

## 1. Scope

This document covers:
- Folder layout for all front-end code
- The neutral design system and its components
- The theming system (how branding is injected per client)
- Global UX rules (loading, empty, error states)
- The admin shell contract (layout, pages, RBAC display rules)
- The module front-end integration contract
- The `/login` page contract
- The E2E test conventions

It does **not** cover:
- Backend implementation (already stable)
- The choice of a specific component library (we build our own primitives on Tailwind)

---

## 2. Front-End Folder Map

The repo already defines the directory layout in `REPOSITORY_STRUCTURE.md`. The front uses **the same layers** as the back. There is no separate `src/components/` or `src/features/` folder — those concerns live in the existing layered directories below.

```
src/
├── app/                          ← Next.js App Router (routing only)
│   ├── (auth)/
│   │   └── login/page.tsx        ← Login route (see §9)
│   ├── admin/                    ← Admin shell entry — guarded
│   ├── (public)/                 ← Public pages
│   └── api/                      ← Route handlers
│
├── shared/                       ← Reusable, no business logic
│   └── ui/
│       ├── primitives/           ← Atoms: Button, Input, Badge, Icon
│       ├── patterns/             ← Compositions: Modal, Toast, DataTable, FormLayout
│       └── admin/                ← Admin-only: AdminPageHeader, AdminSection, etc.
│
├── socle-plus/
│   └── admin/                    ← AdminLayout, AdminHeader, AdminSidebar (already exist)
│
├── modules/[name]/
│   ├── admin/                    ← Module admin pages, registered into the shell
│   └── components/               ← Module-internal components (not exported)
│
└── client/                       ← Project-specific
    ├── pages/                    ← Public page content (Hero, About, Contact)
    ├── components/               ← Client-specific UI (not reusable)
    ├── extensions/               ← Module extensions via published extension points
    └── config/
        └── theme.config.ts       ← The brand injection point (§4)
```

### Mapping the proposed `components/` + `features/` layout

| Proposed (typical Next.js) | BSCore equivalent |
|---|---|
| `src/components/ui/` | `src/shared/ui/primitives/` and `src/shared/ui/patterns/` |
| `src/components/layout/` | `src/socle-plus/admin/` (admin layout) and `src/client/components/` (public layout) |
| `src/components/shared/` | `src/shared/ui/` (everything reusable lives here) |
| `src/features/` | `src/modules/[name]/` (each feature is a module — Socle+ provides registration) |

This is not a renaming exercise — the BSCore layout is intentionally layer-aligned so module → client → shared boundaries are visible from the path.

### Naming conventions

| Element | Convention | Example |
|---|---|---|
| Component file | PascalCase, one per file | `Button.tsx`, `DataTable.tsx` |
| Hook file | camelCase, prefix `use` | `useDisclosure.ts` |
| Test file | sibling, suffix `.test.ts(x)` | `Button.test.tsx` |
| Folder | kebab-case for routes, lowercase for code | `app/admin/`, `shared/ui/primitives/` |
| Type | PascalCase | `ButtonProps`, `TableColumn` |
| `data-testid` | kebab-case, scoped | `login-submit-button`, `users-table-row` |

---

## 3. Server vs Client Components

App Router default. Read this twice — the rest of the doc assumes it.

| Default | When to deviate |
|---|---|
| **Server Component** (no `'use client'`) | Always, until you need one of the deviations below |
| **`'use client'`** | Interactive state (`useState`, `useReducer`), refs (`useRef`), browser APIs, event handlers requiring stateful behavior, third-party client-only libs |

**Forbidden in `'use client'` files:**
- Any read of `cookies()`, `headers()`, or session data
- Any role/permission check
- Any direct call to `db`, Supabase, or backend internals
- Any secret or server-only env var

**Pattern for interactive UI that needs server data:**
The Server Component fetches and computes; the Client Component receives plain serializable props and handles interactivity. Auth and role decisions happen in the Server Component before the Client Component is rendered.

---

## 4. Design System

### Philosophy

The design system is **neutral, thémable, and unbranded**. A component knows nothing about the project it's running in. It reads its colors, radii, and fonts from CSS variables that the client layer overrides.

Three explicit goals:
1. Same component visually adapts to any client without code change
2. No client logo, color, or copy lives in `src/shared/ui/`
3. Modules consume the design system; they don't re-implement it

### Component catalog

All primitives live in `src/shared/ui/primitives/`. All compositions live in `src/shared/ui/patterns/`. Admin-specific compositions live in `src/shared/ui/admin/`.

#### Primitives

| Component | Role | Variants | Notes |
|---|---|---|---|
| `Button` | Trigger an action | `intent`: primary / secondary / destructive / ghost · `size`: sm / md / lg | Always has visible focus state. Loading state via prop, never via wrapper. |
| `Input` | Single-line text input | `state`: default / error · `size`: sm / md | Pair with `Label` and inline error. Never bare. |
| `Textarea` | Multi-line text input | Same as Input | Auto-grow optional, off by default. |
| `Select` | Native select | Same as Input | Native first; only build a custom listbox when a real need appears (multi-select, search). |
| `Checkbox` | Boolean / multi-choice | `state`: default / error | Always paired with a `<label>`. |
| `Switch` | On/off toggle | — | Use for instant-effect settings; use `Checkbox` for form fields. |
| `Label` | Form field label | — | Always present on every form field. |
| `Badge` | Static status indicator | `intent`: neutral / success / warning / danger / info | Never clickable. For clickable status pills use `Button` ghost. |
| `Icon` | Lucide icon wrapper | `size`: sm / md / lg | Tree-shakable; import per-icon. Decorative icons get `aria-hidden`. |
| `Spinner` | Indeterminate progress | `size`: sm / md / lg | Never use for skeletons — use `Skeleton`. |
| `Skeleton` | Loading placeholder | — | Width and shape match the eventual content; not a generic gray block. |

#### Patterns

| Component | Role | Notes |
|---|---|---|
| `Card` | Bounded content surface | No shadow ladders — one shadow tier project-wide. |
| `Modal` / `Dialog` | Blocking interaction | Built on a headless primitive (Radix or Ariakit, decide later). Traps focus, restores it on close, ESC closes. |
| `Toast` | Transient feedback | Top-right by default. Three intents: success / error / info. Auto-dismiss; persistent only on error if action required. |
| `DataTable` | Tabular data | Columns are declarative (label, accessor, render). Sort and pagination provided. No fancy tree, no grouping in V1. |
| `FormLayout` | Consistent form shape | Vertical labels, error slots, footer with primary + secondary actions. |
| `EmptyState` | "Nothing to show yet" | Icon + heading + one-line copy + optional CTA. |
| `ErrorState` | "Something went wrong" | Icon + heading + retry button when applicable. Never expose the raw error. |
| `LoadingState` | Inline loading region | Either a `Spinner` with copy, or `Skeleton` blocks shaped like the eventual content. |

### Rules of usage

1. **No design system component contains domain logic.** A `Button` does not know about `bookings`. If you find yourself writing `BookingButton`, the right place is `src/modules/booking/components/`.
2. **No design system component reads the database, the session, or `process.env`.** They receive props and emit callbacks.
3. **Variants are enumerated, not free-form.** `intent="primary"` not `style={{ background: '#0070f3' }}`.
4. **Composition over options.** Prefer `<Modal><Modal.Header/></Modal>` over a `headerContent` prop with conditional rendering.
5. **Accessibility is part of the contract.** A primitive that ships without keyboard support, focus rings, and proper ARIA is incomplete.

### What we don't ship in V1

No date picker, no rich text editor, no chart, no autocomplete. Each is a real piece of work and brings vendor decisions; defer until a module actually needs one.

### Third-party libs we accept

- **Tailwind CSS** — styling
- **`clsx`** + **`tailwind-merge`** — class composition (already used via `cn` in `src/shared/ui/utils/`)
- **`lucide-react`** — icons
- **`@radix-ui/react-*`** *or* **`@ariakit/react`** — only for headless primitives where accessibility is hard (Dialog, Popover, Tabs). Pick one and stick with it.

Anything else requires an entry in `package.json` review and a one-line justification.

---

## 5. Theming

The theming system is the **single mechanism** that adapts the UI to a given client. No other path exists.

### How it works

1. The design system uses **CSS custom properties** (variables) for all colors, radii, fonts, and spacing scales that need to vary per project.
2. Tailwind reads those variables in `tailwind.config.ts`. Components use Tailwind classes (`bg-primary`, `text-foreground`, `rounded-lg`).
3. The variables are **defined once in `src/client/config/theme.config.ts`** for the current client and applied as inline CSS or via a global stylesheet at the app root.
4. Components never hardcode a color or radius. They reference the token.

### Token catalog

| Category | Tokens (examples — not exhaustive) |
|---|---|
| Color — surface | `background`, `foreground`, `muted`, `muted-fg`, `border` |
| Color — semantic | `primary`, `primary-fg`, `accent`, `accent-fg`, `destructive`, `destructive-fg` |
| Color — feedback | `success`, `warning`, `info` |
| Radius | `radius-sm`, `radius-md`, `radius-lg` |
| Spacing | inherited from Tailwind defaults; do not redefine unless required |
| Typography | `font-sans`, `font-mono`; size scale via Tailwind defaults |

Token names match the Tailwind theme keys so the same name appears in JSX (`bg-primary`) and in the variable definition (`--primary`).

### Absolute rules

1. **No hex, rgb, or HSL value in any component file.** Every color comes from a token.
2. **No magic numbers for spacing or radius.** Use Tailwind classes that map to the token scale.
3. **No `style={{ color: ... }}` for theming purposes.** The only acceptable inline style is one driven by a runtime computed value (e.g., a chart bar height). Static styling goes through Tailwind.
4. **One shadow tier project-wide.** No `shadow-sm`/`shadow-md`/`shadow-lg`/`shadow-2xl` ladder. If three depths are needed, document why before adding.
5. **Dark mode is opt-in per project.** When enabled, it's a second set of variables, not a separate codebase.

### Per-client branding

`src/client/config/theme.config.ts` is the only place where a client's brand values live. Logo asset, accent color, font family — all here. The client folder also contains overrides for any client-only component.

A client never edits `src/shared/ui/`. If a client genuinely needs a component the design system doesn't have, the conversation is: should this be added to `src/shared/ui/` for everyone, or kept in `src/client/components/` as bespoke. The default is "client-specific" until reused twice.

---

## 6. UX Rules (Front-end specifics)

`docs/UX_RULES.md` is the authoritative source. The rules below are the front-side restatement so they can't be missed.

### Required states for any view that loads data

| State | When | Component |
|---|---|---|
| Loading | While the server is computing or fetching | `LoadingState` (Spinner or Skeleton) |
| Empty | Successfully loaded, nothing to show | `EmptyState` |
| Error | Load or action failed | `ErrorState` |
| Forbidden | User authenticated but not authorized for this resource | Redirect to `/admin` with a Toast, or render a 403 page |
| Not found | Resource doesn't exist | Next.js `notFound()` boundary |

A page that doesn't handle empty and error explicitly is incomplete.

### Forms

- **Validation source of truth: a Zod schema** colocated with the Server Action that consumes it. The same schema may be re-imported by the Client Component to drive inline error display, but the server is always authoritative.
- **Submission flow:** Client Component dispatches a Server Action. The Action validates, runs the domain logic, and returns either `{ ok: true, data }` or `{ ok: false, errors }`. The Client Component displays errors inline.
- **No client-only validation.** The same Zod schema runs on the server. Doubling it on the client is optional and kept identical.
- **Disable the submit button while in flight** to prevent double submission.
- **Preserve form values on error.** A failed submit must not wipe the form.

### Feedback

- **Success of a mutation:** Toast (success intent), then update UI optimistically or refresh the data.
- **Error of a mutation:** Toast (error intent) with a generic message; details go to the inline error slots.
- **Background errors (e.g., a session expired mid-action):** Redirect to `/login` with a Toast explaining "Your session has expired".

### Accessibility (minimum bar)

- Every form field has an associated `<label>`.
- Every interactive element is keyboard reachable and has a visible focus ring.
- Color is never the only signal of state — pair it with an icon or text.
- Heading order is logical, no level skipped.
- Icon-only buttons have `aria-label`.
- Modals trap focus and return it on close.

These are non-negotiable. They go in the QUALITY_CHECKLIST.

---

## 7. Admin UI

This is the most important section for the modules — every module ships its admin section through this contract.

### Layout

The admin shell already exists in `src/socle-plus/admin/`:
- `AdminLayout` (Server Component) — outer container
- `AdminHeader` — logo, user info, logout
- `AdminSidebar` — nav from the registry, filtered by user role

Modules **never reimplement** the layout. They render their content into `children`.

### Required admin compositions (to build in `src/shared/ui/admin/`)

| Component | Role |
|---|---|
| `AdminPageHeader` | Page title + breadcrumbs + primary action slot. Mandatory at the top of every admin page. |
| `AdminSection` | Bounded content section inside a page (a card with a header). Multiple per page allowed. |
| `AdminEmptyState` | Empty list with a primary "Create" CTA. |
| `AdminForbidden` | "You don't have access to this page" — same shape as a 403 page. |
| `AdminNotFound` | Resource not found — links back to the parent list. |

### Rule: `src/shared/ui/admin/` is not a parallel design system

Components under `src/shared/ui/admin/` are **compositions of the primitives** in `src/shared/ui/primitives/` and `src/shared/ui/patterns/`. They must not:
- Introduce styles, Tailwind classes, or color values specific to the admin context
- Define their own variant ladder, spacing scale, or token set
- Bypass the token catalog (§5) under any pretext

Any visual change to an admin composition goes through the primitives or the tokens — never as a one-off in `src/shared/ui/admin/`. If a need cannot be expressed with the existing primitives, the primitive is extended; the admin layer never forks the system.

### Page archetypes

A module admin page falls into one of four shapes. Pick the closest, do not invent a fifth.

| Archetype | Composition |
|---|---|
| **List** | `AdminPageHeader` + `DataTable` + pagination. Empty state shows "No items yet" with a "Create" CTA. |
| **Detail (read-only)** | `AdminPageHeader` + `AdminSection` × N (display fields). Edit button in the header opens the edit page or a modal. |
| **Create / Edit (form)** | `AdminPageHeader` + `FormLayout` + footer with Cancel and Submit. Cancel returns to the list. |
| **Dashboard** | `AdminPageHeader` + grid of summary `Card`s. No business logic — each card calls a module-provided server function. |

### RBAC at the UI level

**The UI never makes a security decision.** All security decisions are server-enforced (`requireAdminAuth()`, `can(user, action, resource)` in the Server Action). The UI only **reflects** what the server has already authorized.

Allowed UI patterns:
- Hide a menu item the current user cannot use, based on `user.role` passed from the server: ✅
- Disable a button based on `can(user, 'delete', 'posts')` evaluated **server-side** and passed as a prop: ✅
- Render different cards on the dashboard based on `user.role` passed from the server: ✅

Forbidden UI patterns:
- Fetching the user's role from a client-side endpoint: ❌
- Reading the role from `localStorage` or a cookie in client code: ❌
- Skipping the server check because "the UI hides the button anyway": ❌
- Using `'use client'` to call `requireAdminAuth()`: ❌

Every protected admin route is protected at the layout (`requireAdminAuth()`) **and** every Server Action verifies again. The UI is the third layer, not the first.

---

## 8. Module Front-end Integration Contract

A module is plug-and-play if it can be activated with three actions: declare it in the project's module list, run the migrations it ships, and the admin nav reflects it without further work.

### What every module must expose

| Surface | Mechanism | Where it lands |
|---|---|---|
| Routes | `src/app/admin/[module-prefix]/page.tsx` | Module's admin pages live under the admin route group |
| Nav entries | `registerAdminNav({ label, href, requiredRole, icon })` from `@/socle-plus/admin` | Sidebar |
| Permissions | `declarePermissions('resource', { admin: [...], super_admin: ['manage'] })` | RBAC engine |
| Components | `src/modules/[name]/components/` | Internal — not exported outside the module |
| Schemas | `src/modules/[name]/domain/schemas.ts` | Zod schemas, source of truth for forms |
| Server Actions | `src/modules/[name]/admin/actions.ts` | Validated by the Zod schemas, return `{ ok, data | errors }` |

### What every module must NOT do

- No `useState` in its top-level page (use Server Components; mark only sub-components `'use client'` when interactive)
- No direct DB or Supabase call from a client component
- No import from another module
- No theme override — modules consume the theme; they don't define it
- No global CSS — module styles are Tailwind classes only
- No new top-level token in the design system without justification

### Component visibility

Components under `src/modules/[name]/components/` are **internal by default**. They:
- Cannot be imported by another module
- Cannot be imported by `src/client/`
- Are not re-exported through the module's `index.ts`

If a component genuinely needs to be reused, exactly one of two paths is allowed:
1. **Promote to `src/shared/ui/`** — the right answer when the need is generic and unbranded. The promotion is a deliberate decision, not a side effect of an import.
2. **Expose via the module's documented public API** — only when the component encapsulates module-specific behavior that genuinely belongs in the public interface. The dependency must then be declared per `BOUNDARIES.md`.

Any direct import path that bypasses both options is a boundary violation and is rejected in code review.

### Module folder skeleton (front-side)

```
src/modules/[name]/
├── admin/
│   ├── page.tsx              ← list page (Server Component)
│   ├── [id]/page.tsx         ← detail page (Server Component)
│   ├── new/page.tsx          ← create page
│   ├── [id]/edit/page.tsx    ← edit page
│   ├── actions.ts            ← Server Actions, Zod-validated
│   └── nav.ts                ← registerAdminNav() calls
├── components/               ← internal UI (not exported)
├── domain/
│   └── schemas.ts            ← Zod schemas — single source of truth
└── index.ts                  ← module public interface
```

### Activation contract

A project's `config/modules.config.ts` lists the active modules. At boot, each module's `register()` runs once, calling `registerAdminNav()` and `declarePermissions()`. After this, the admin shell is fully wired without any other front-end work.

---

## 9. `/login` Page

This page is required because `requireAdminAuth()` redirects to `/login` when authentication fails.

### Location

`src/app/(auth)/login/page.tsx` (Server Component, no `'use client'` at the top level).

The `(auth)` route group keeps login outside the `/admin` guarded layout — so an unauthenticated user can actually reach it.

### Behavior

| Scenario | Behavior |
|---|---|
| User reaches `/login` already authenticated | Server Component checks the session; if valid and a role exists, redirect to `/admin` (or `?returnTo=` if provided and same-origin) |
| User submits valid credentials | Server Action calls `signIn(email, password)` from `@/socle-plus/auth`; on success, redirect to `/admin` |
| User submits invalid credentials | Server Action returns `{ ok: false, error: 'Invalid email or password' }`; UI displays the generic message |
| User has a Supabase session but no `user_roles` row | Treated as not authenticated — `requireAdminAuth()` already redirects back to `/login` |
| `signIn()` throws (network, Supabase down) | Server Action catches, logs server-side, returns generic "Something went wrong, please try again" |

### Page composition

- `AdminPageHeader`-style heading, but standalone (this page does not live inside the admin layout)
- `FormLayout` with two fields (email, password) and a Submit button
- Toast or inline error region under the form
- No "Forgot password" or "Sign up" links in V1 — Supabase manages reset flow externally; sign-up is admin-driven (super_admin creates users)

### Forbidden on the login page

- Reading or displaying any user data
- Storing anything in `localStorage`
- Calling Supabase directly from client code (always via the `signIn()` server helper)
- Customizing the form for "remember me" or social login in V1 — extend later when a real need exists

### `returnTo` handling

If the redirect carries a `returnTo` parameter, the login page validates it server-side:
- Must be a relative path (starts with `/`)
- Must not be `/login` itself (avoid loops)
- Anything else is dropped silently and the user lands on `/admin`

This avoids the open-redirect class of vulnerabilities (`SECURITY_RULES.md` §11).

### UX requirements (alignment with §6)

The `/login` page is a form page and inherits every rule from §6 and `docs/UX_RULES.md`. The following are explicit because they are routinely missed on auth surfaces:

- **Submit button is disabled while the action is in flight.** Prevents double submission and signals state clearly.
- **Loading state is visible.** A `Spinner` inside the button (or beneath the form) confirms the request was accepted.
- **Error display:**
  - **Generic global message** for any auth failure (Toast or inline error region) — same wording for invalid credentials, locked account, network error, Supabase outage. The page never reveals which factor is wrong.
  - **Field-specific inline errors** for local validation failures (missing email, malformed email, missing password). These are not auth errors and may be precise.
- **Form values are preserved on failure.** Neither field is cleared. The user corrects what was wrong and resubmits without retyping unchanged values.
- **No success toast.** The redirect to `/admin` is the success signal.

The `/login` page is not exempt from `docs/QUALITY_CHECKLIST.md` — the same UX, accessibility, and form rules apply.

---

## 10. E2E Test Conventions (Playwright)

Playwright is already a dev dependency. This section defines the conventions that make tests stable from day one.

### Directory layout

The structure already exists in `e2e/`:

```
e2e/
├── fixtures/    ← seeded test data, page object models
├── helpers/     ← login helper, screenshot helper, etc.
└── specs/
    ├── auth/
    ├── admin/
    └── [module-name]/
```

Each module ships its own specs under `e2e/specs/[module-name]/`.

### `data-testid` convention

- Every interactive element that participates in a test gets a `data-testid`.
- Format: `kebab-case`, scoped to the surface: `login-email-input`, `users-table-row-{id}`, `posts-create-submit`.
- `data-testid` is the **only** selector tests should use. No CSS class selectors, no text selectors except for the tightly-scoped "expected message" assertions.
- Component primitives accept and forward a `data-testid` prop down to the relevant DOM node.

### What's testable from day one

| Element | `data-testid` |
|---|---|
| Login form fields | `login-email-input`, `login-password-input`, `login-submit` |
| Login error region | `login-error` |
| Admin sidebar nav links | `admin-nav-{slug}` (e.g. `admin-nav-dashboard`) |
| Logout button | `admin-logout` |
| Toast container | `toast-container`; each toast: `toast-{intent}` |
| Forms in admin | `{module}-{form}-{field}` for inputs; `{module}-{form}-submit` |
| Tables | `{module}-table`; rows: `{module}-table-row-{id}` |

### First three E2E targets

These ship with the front-end V1, before any module:

1. **Auth flow** — visit `/login`, submit valid credentials, land on `/admin`. Visit `/admin` unauthenticated, redirected to `/login`. Submit wrong credentials, see generic error.
2. **Admin shell** — once logged in, sidebar contains expected nav items for the role. Logout returns to `/login`. Hitting a forbidden URL by direct navigation redirects (not a "you cannot click this button" silent block).
3. **Health endpoint** — `/api/health` responds 200 with the expected JSON shape (a thin sanity test, mostly to validate the deployment).

### Test environment expectations

- E2E runs against a deployed dev environment with seeded users (one `admin`, one `super_admin`, one with no role).
- Tests never mock the backend — Playwright tests are integration tests by definition.
- Each test cleans up its own data, or runs in a fresh DB per CI run. No shared mutable state across tests.

---

## 11. Quality Rules (front-side)

The base rules in `ENGINEERING_RULES.md` apply. The following are front-specific clarifications.

### TypeScript

- Strict mode is already enforced. No `any`, no `as` without a comment.
- Component props are explicitly typed. `interface ButtonProps` not inferred.
- Server Actions and their return types are typed (`Promise<{ ok: true; data: T } | { ok: false; errors: ... }>`).

### Component size

- A component file exceeding ~200 lines is a smell. Either split (composition) or it's doing too much.
- If a component takes more than 8 props, it's two components in disguise.
- Conditional rendering blocks deeper than two levels — extract.

### Logic / UI separation

- A component renders. It calls server actions. It does not compute business outcomes.
- Domain logic lives in `src/modules/[name]/domain/` (or `src/socle-plus/`) — never in `.tsx`.
- A component that imports `db` directly is a bug.

### State management

- Default: Server Components + URL state via `useSearchParams`.
- Local UI state: `useState`.
- Cross-component state: lift to the nearest common ancestor; only introduce a context provider when 3+ components genuinely share the state.
- **No global client state library** in V1. Redux, Zustand, Jotai are all a "no" until a concrete need is documented.

### CSS

- Tailwind only. No CSS modules, no inline `<style>` blocks, no CSS-in-JS.
- The single global stylesheet is `src/app/globals.css` — Tailwind directives, root variables, baseline reset. Nothing else.
- A component does not have a sibling `.css` file.

### Bundle hygiene

- Server Components are the default. A `'use client'` boundary should be the smallest practical leaf, not a whole page.
- Heavy client libraries (rich text, date picker, charts) are dynamically imported (`next/dynamic`) so they don't ship in the initial bundle.
- Watch the build output. The home page should stay under 150 kB First Load JS until a deliberate decision raises that bar.

### Comments

- Same rule as the back: explain why, not what. A `<Button>` doesn't need a comment.
- A non-obvious accessibility decision, a workaround for a Next.js quirk, or a deliberate deviation from the design system — comment.

---

## 12. Out of Scope (V1)

Listed explicitly so they don't sneak in:

- Internationalization framework (`next-intl`, `next-i18next`). UI strings are French or English per project — picked at the project level. No runtime locale switcher in V1.
- Animation library beyond Tailwind transitions. No Framer Motion, no react-spring.
- A storybook or component playground. Tests + visual review on the dev server.
- Email template rendering for module notifications. That's a Notifications module concern.
- A drag-and-drop library. No module needs it in V1.
- A WYSIWYG / rich text editor. Add when CMS or Blog modules require one — pick then.

When V1 becomes V2 and one of these is needed, an ADR records the decision and updates this document.

---

## 13. Definition of Done — Front-end Task

A front-end task is done when:

1. ✅ TypeScript strict passes (`npm run typecheck`)
2. ✅ ESLint passes with zero warnings (`npm run lint`)
3. ✅ Unit tests cover the component's behavior (interactivity, prop variants, accessibility) (`npm test`)
4. ✅ The four UX states (loading, empty, error, success) are handled — or N/A is justified
5. ✅ Accessibility minimum is met (label, focus, color-not-only)
6. ✅ No hardcoded color, hex, or magic spacing — only Tailwind classes mapped to tokens
7. ✅ A `data-testid` is exposed on every element a Playwright test would target
8. ✅ Build passes (`npm run build`)
9. ✅ The Quality Report from CLAUDE.md is filled — Architecture, Boundaries, Security (RBAC checked server-side), Tests, UX, Accessibility, Performance, Maintainability

If any item is ❌ or ⚠️ without justification, the task is not done.

---

## 14. Open Questions to Resolve at Project Start

These are deliberate "we'll decide when we get there" markers — not blockers, but decisions to make before the first module ships.

| OQ | Question | When to decide |
|---|---|---|
| F-1 | Headless primitives lib: Radix vs Ariakit | Before building the first `Modal` |
| F-2 | Toast lib: built in-house or `react-hot-toast` | Before the first mutation in admin |
| F-3 | Form helper: bare server actions or `react-hook-form` | Before the first non-trivial form (more than 5 fields with conditional rendering) |
| F-4 | Date input: native vs custom | Whenever the first module needs a date field |
| F-5 | Dark mode: shipped or deferred per project | Per-project decision; not a default |

Each decision, when made, gets an ADR or a paragraph appended to this file.

---

**End of cadrage.** This document is the contract. Front-end implementations, module front-side, and client branding are evaluated against it in code review.
