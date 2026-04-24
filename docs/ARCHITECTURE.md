# ARCHITECTURE — High-Level System Design

## 1. Overview

BSCore follows a **layered architecture with explicit boundaries**. Layers are not just conceptual — they must be physically enforced at the code organization level. A layer can only depend on the layer directly beneath it. Lateral dependencies (module-to-module, client-to-core) are forbidden.

This document describes the architecture without reference to any specific technology. Implementation choices are deferred.

---

## 2. Layer Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│  FRONT-END (Project-specific)                                            │
│  Custom UI, framework of choice, consumes API/SSR contracts from below   │
├──────────────────────────────────────────────────────────────────────────┤
│  CLIENT-SPECIFIC LAYER                                                   │
│  Custom business logic, overrides, bespoke integrations                  │
│  Depends on: Socle+ and selected Modules                                 │
├──────────────────────────────────────────────────────────────────────────┤
│  MODULES LAYER                                                           │
│  Independent domain blocks (CMS, Blog, Booking, etc.)                   │
│  Each module: Socle or Socle+ as its only upward dependency              │
├──────────────────────────────────────────────────────────────────────────┤
│  SOCLE+ (if activated)                                                   │
│  Auth, DB, roles, admin shell, audit log                                 │
│  Depends on: Socle only                                                  │
├──────────────────────────────────────────────────────────────────────────┤
│  SOCLE                                                                   │
│  Routing, config, logging, error handling, security baseline             │
│  Depends on: nothing above                                               │
└──────────────────────────────────────────────────────────────────────────┘
```

**Dependency arrows run only downward.** A lower layer has zero awareness of anything above it.

---

## 3. Application Structure (Logical)

```
BSCore/
├── socle/                  ← Core infrastructure, always present
├── socle-plus/             ← Extended infrastructure, activated per project
├── modules/
│   ├── cms/
│   ├── blog/
│   ├── media/
│   ├── forms/
│   └── ...
└── projects/
    └── client-a/           ← Client-specific extensions
        ├── extensions/
        └── overrides/
```

Each module directory has an internal structure that mirrors its responsibilities:

```
modules/blog/
├── api/         ← Route handlers / controllers
├── domain/      ← Business logic (pure, no HTTP)
├── data/        ← Data access layer (queries, migrations)
├── admin/       ← Admin section registration and views
└── index.ts     ← Module registration entry point
```

---

## 4. Data Flow

### 4.1 Read Flow (Public Front-End)

```
Browser Request
  → Socle: routing middleware chain
  → Module route handler (e.g., Blog: /posts/:slug)
    → Module domain service
      → Module data layer (queries DB via Socle+ connection)
        → Returns data
    → Module shapes response
  → Front-end receives JSON (API) or rendered HTML (SSR)
```

### 4.2 Write Flow (Admin / Authenticated)

```
Admin UI Request
  → Socle: routing, security headers
  → Socle+: auth middleware (verify session + role)
    → If authorized: continue
    → If not: 401/403 response (Socle error contract)
  → Module route handler (e.g., CMS: POST /admin/pages)
    → Module domain service (validates input, applies rules)
      → Module data layer (writes to DB via Socle+ connection)
        → Returns result
  → Module shapes response
  → Admin UI receives confirmation or error
```

### 4.3 Cross-Module Communication

Modules never import each other directly. There are two valid patterns for inter-module interaction:

**Pattern 1 — Declared dependency (explicit, synchronous)**
A module can declare a dependency on another module. This dependency is declared in the module's manifest, not expressed through a direct code import. At runtime, the dependent module calls the other through its public interface only — never by reaching into its internals or data layer.

This is appropriate when Module A genuinely cannot function without Module B. Example: Orders cannot exist without Commerce (product catalog). The dependency is declared; communication goes through Commerce's public interface.

**Pattern 2 — Events (decoupled, asynchronous)**
When Module A should react to something Module B does, but neither needs to know about the other, use events. Module B emits an event; Module A listens. The event bus is simple, lightweight infrastructure — not a framework.

```
Booking Module: emits event("booking.confirmed", { bookingId, userId })
  ↓
Event Bus (lightweight, in-process)
  ↓
Notifications Module: handles event("booking.confirmed")
  → sends confirmation email
```

**Event system principles (V1):**
- Keep it simple and explicit. One emitter, one or more documented listeners per event.
- Every event must be documented before it is added: what emits it, what listens to it, and why.
- No undocumented side effects. If you cannot describe the full listener chain, the design is wrong.
- Goal is decoupling, not choreography. If the event graph becomes hard to follow, that is a signal to reconsider module boundaries — not to add more tooling.
- Naming convention: `domain.verb` (e.g., `booking.confirmed`, `order.placed`, `user.created`)

---

## 5. Admin Shell Architecture

The admin shell is a container owned by Socle+. Modules populate it.

```
Socle+ Admin Shell
├── Layout (header, sidebar, breadcrumbs)     ← Socle+ owns
├── Auth guard                                ← Socle+ owns
├── Navigation registry                       ← Socle+ owns, modules write to
└── Content area                              ← Modules own their sections
    ├── [CMS module admin section]
    ├── [Blog module admin section]
    └── [Client-specific admin section]
```

Module admin sections are registered, not hard-coded. The shell does not know what modules exist. It knows only how to render what has been registered.

---

## 6. Module Activation Architecture

A project declares which modules it activates. The activation mechanism:

1. Reads the project's module list
2. Runs each module's registration function
3. Module registration does:
   - Registers its routes
   - Registers its admin nav items
   - Registers its migrations
   - Registers its event listeners
   - Registers any service interface implementations

```
Project boot sequence:
  1. Load Socle (config, logging, routing, middleware)
  2. Load Socle+ if declared (DB connect, auth, admin shell)
  3. For each activated module:
     a. Run module.register(app, socle, soklePlus)
     b. Module attaches its routes, admin nav, migrations, listeners
  4. Run pending migrations
  5. Start accepting requests
```

---

## 7. Separation of Concerns

### 7.1 HTTP vs Domain vs Data
Every module internally separates:

- **HTTP layer:** handles request parsing, input validation, response shaping. Has no business logic.
- **Domain layer:** implements business rules. Has no HTTP or database awareness.
- **Data layer:** executes queries, maps results to domain objects. Has no business logic.

Cross-layer calls are one-directional: HTTP → Domain → Data. Never reverse.

### 7.2 Front-End vs Back-End Contract
The platform defines contracts (API response shapes, SSR data structures, service interfaces) but never dictates the front-end framework or its location. The front-end can live in the same repository or a completely separate one — this is a project-level decision, not a platform constraint.

The front-end team can build with React, Vue, Astro, plain HTML, or any other stack. Sharing front-end patterns, component libraries, or design systems across projects is encouraged at the project level. The platform does not provide or manage these — it provides the contracts those components consume. The contract is stable; the implementation is free.

### 7.3 Module vs Client
Client-specific code extends or overrides module behavior through explicit extension points. It does not patch module code directly. If a module does not expose an extension point needed by a client, the module is extended to add one — the client code does not bypass the module.

---

## 8. Key Architectural Decisions

### Decision: No direct module-to-module imports; explicit dependencies allowed
**Rationale:** Direct code imports create invisible coupling — one module's refactor silently breaks another. Where a genuine dependency exists between modules (e.g., Orders on Commerce), it must be declared explicitly in the module's manifest and communicated through the dependent module's public interface only. Where modules simply react to each other's events, they use the event bus and remain mutually unaware of each other's internals.

### Decision: Migrations belong to modules
**Rationale:** A module's schema is part of the module. Centralizing migrations in a shared folder creates confusion about ownership. Modules run their own migrations through a runner Socle+ provides.

### Decision: Front-end location is a project choice, not a platform constraint
**Rationale:** The platform does not dictate where the front-end lives or what framework it uses. It may co-exist in the same repository or be completely separate. What the platform enforces is a stable contract boundary — the back-end never reaches into the front-end, and the front-end never bypasses the contract to access internals. Reusing front-end patterns across projects is valuable and encouraged, but managed at the project level.

### Decision: Admin shell is a container, not a framework
**Rationale:** Auto-generated CRUD admin frameworks (like ActiveAdmin, EasyAdmin) are seductive but create long-term dependencies on their conventions. BSCore's admin shell renders what modules provide, no more.

### Decision: Client code lives in a separate directory, not in modules
**Rationale:** Mixing client-specific code into shared modules is the #1 cause of platform drift in reusable systems. Physical separation enforces the architectural intent.

---

## 9. Risk Areas

### Risk: Module boundaries erode over time
**Mitigation:** Boundary rules are documented explicitly in `BOUNDARIES.md`. Code review must check for boundary violations before merge.

### Risk: Socle+ grows into a CMS by default
**Mitigation:** The "What is NOT in Socle+" section of `SOCLE_PLUS.md` is a checklist for every Socle+ change request.

### Risk: Client-specific features get promoted into modules prematurely
**Mitigation:** A feature should not move to a module until it has been needed in at least two separate projects with no client-specific adaptation required.

### Risk: Event system grows complex and hard to trace
**Mitigation:** Keep the event system simple by design — it is lightweight infrastructure, not a choreography engine. Every event must be documented with its emitter and all listeners before it is added. If the event graph becomes hard to follow, that is a signal to reconsider module boundaries, not to add more tooling.
