# VISION — BSCore Platform Philosophy

## 1. Purpose

BSCore is a reusable web platform designed to create custom websites for clients, from simple static showcases to fully administrable applications with business logic.

The goal is NOT to build yet another CMS or framework. The goal is to establish **a disciplined, layered system** that allows maximum reuse while preserving full customizability per project — with zero lock-in at the client level.

---

## 2. Core Philosophy

### Composition over configuration
Rather than shipping a single monolithic platform configured per project, BSCore is composed of independent, intentional layers. Each layer has a strict responsibility. Each layer builds on the one below it.

### Minimal by default, extensible by design
Every layer starts at its minimum viable footprint. Features are added through explicit module activation, never by default. This prevents the most common failure mode of reusable platforms: the accumulation of dead weight over time.

### Custom front-ends, shared back-end contracts
The front-end is ALWAYS project-specific. BSCore never dictates UI, and does not enforce where the front-end lives — it can reside in the same repository as the back-end or in a completely separate one. That is a project-level decision.

What the platform provides is a stable contract (API response shapes, SSR data structures, service interfaces) that any front-end can rely on. Reusing front-end patterns, component libraries, or design systems across projects is encouraged — but that happens at the project level, not at the platform level. The platform defines contracts, not implementations.

### Client code must never pollute the core
Client-specific requirements are frequent, unpredictable, and often contradictory. The system must physically enforce separation so that one client's customization cannot degrade another project built on the same base.

---

## 3. The Four Layers

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENT-SPECIFIC                        │
│  Custom features, overrides, business rules per client  │
├─────────────────────────────────────────────────────────┤
│                     MODULES                             │
│  Independent, activable functional blocks               │
│  (CMS, Blog, Booking, E-commerce, Forms, etc.)         │
├─────────────────────────────────────────────────────────┤
│                    SOCLE+                               │
│  Extended base: auth, database, roles, admin shell      │
├─────────────────────────────────────────────────────────┤
│                     SOCLE                               │
│  Minimal foundation: routing, config, env, helpers      │
└─────────────────────────────────────────────────────────┘
```

### Layer 1 — Socle (Base)
The absolute minimum to run a project. No database, no auth, no admin. Suitable for simple informational websites managed directly in code or flat files. Socle must remain so lightweight that adding it to a project has near-zero overhead.

### Layer 2 — Socle+ (Extended Base)
The foundation for administrable projects. Adds database connectivity, authentication, session management, role-based access control, and an admin shell. Socle+ is activated when a project requires users, data persistence, or an administration interface. It does NOT include any business-domain features.

### Layer 3 — Modules
Independent functional blocks that implement specific business domains: CMS, Blog, Booking, E-commerce, Forms, CRM, etc. Modules declare their own dependencies (Socle, Socle+, or other modules they explicitly depend on). They are activated per project. Modules may not import each other directly — when one module depends on another, that dependency is declared explicitly and communication happens through public interfaces or events, never through direct code coupling.

### Layer 4 — Client-Specific Extensions
Code that exists for one client and one client only. Custom workflows, unique business rules, bespoke integrations. This code is never merged into core or modules. It lives in its own isolated space and is explicitly excluded from reuse.

---

## 4. Long-Term Goal

BSCore should reach a state where:

- A new **simple project** (landing page, vitrine) can be bootstrapped from Socle in under an hour with no friction.
- A new **administrable project** (client portal, content site) can be bootstrapped from Socle+ with the relevant modules activated in under half a day.
- A new **complex client project** (e-commerce, booking platform) adds only the client-specific layer on top of a stable, battle-tested module foundation.
- **No project diverges the core.** Each project enriches it at most by contributing a new module — never by patching shared infrastructure.

The long-term measure of success is: how fast can I spin up project #10 vs project #1, and how much confidence do I have in the stability of the shared foundation?

---

## 5. What BSCore Is Not

- It is NOT a CMS. It may host a CMS module, but the platform itself has no editorial concepts built in.
- It is NOT a framework. It is a layered architecture sitting on top of existing frameworks.
- It is NOT a SaaS product. It is an internal development platform for controlled, custom client work.
- It is NOT designed for open-source community contribution at this stage. Stability and coherence take precedence over openness.
