# SOCLE+ — Extended Foundation

## 1. What Socle+ Is

Socle+ is the extension of Socle for projects that require users, data persistence, and an administration interface. It answers the question: **"What is the minimum shared infrastructure for any administrable project?"**

Socle+ is activated intentionally. A project that does not need administration simply does not activate Socle+. There is no middle ground — you are either on Socle or on Socle+.

Socle+ inherits everything from Socle. It adds exactly what is needed to support a secured, role-aware, database-connected application shell. Nothing more.

---

## 2. What Belongs in Socle+

### 2.1 Database Connectivity
- Database connection pool initialization
- ORM/query builder setup (configured, not opinionated on schema)
- Database health check integration (extends Socle's `/health` endpoint)
- Migration runner (applies schema migrations from modules and client extensions)
- **NOT** any specific table or model — those belong to modules or client-specific

### 2.2 Authentication
- Session management (creation, renewal, invalidation)
- Login / logout lifecycle
- Password hashing and verification
- Token management (JWT, refresh tokens, or session cookies — one chosen approach)
- "Remember me" and session expiry logic
- **NOT** social login, SSO, or OAuth — those are module-level concerns unless required by every project

### 2.3 Authorization & Roles
- Role-based access control (RBAC) foundation
- Role assignment to users
- Permission check interface: `can(user, action, resource)`
- Middleware for protecting routes based on roles
- **NOT** specific roles (e.g., "editor", "moderator") — those are defined per module or per client
- **NOT** attribute-based access control (ABAC) — too complex for the base layer

### 2.4 User Model Foundation
- Minimal user entity: identifier, credentials, role(s), timestamps
- User creation and deactivation
- No profile fields, no business-specific attributes — those are module or client concerns

### 2.5 Admin Shell
- A minimal, framework-level admin interface bootstrap
- Navigation registration system (modules register their admin sections here)
- Basic layout and chrome (header, sidebar, breadcrumbs)
- Authentication guard for all admin routes
- **NOT** any admin content pages — those belong to modules
- **NOT** a full admin framework (no auto-generated CRUD) — intentionally minimal

### 2.6 Audit Logging
- Record of critical events: login, logout, permission changes, user creation/deletion
- Stored in the database, accessible to admins
- **NOT** business-domain event logging (e.g., "order placed") — that belongs to modules

### 2.7 Multi-Tenancy Foundation (Optional, Deferred)
- If required, Socle+ should support a tenant identifier concept at the data access layer
- This should NOT be implemented until a multi-tenant project requires it
- Flagged here as a known future concern to avoid designing it out by accident

---

## 3. What Is Intentionally NOT in Socle+

Socle+ resists scope creep. The following are common requests that must be rejected at the Socle+ level:

| Not in Socle+ | Belongs In |
|---|---|
| Content types / editorial models | Module: CMS |
| Blog post, article, media management | Module: Blog, Module: Media |
| Form builder or form submissions | Module: Forms |
| E-mail campaigns or newsletters | Module: Email Marketing |
| Booking or reservation logic | Module: Booking |
| Product catalog or orders | Module: Commerce |
| API key management for third parties | Module: API Gateway or Client-specific |
| Complex notification workflows | Module: Notifications |
| Social auth (Google, GitHub, etc.) | Module: Social Auth |
| Two-factor authentication | Module: 2FA |
| User profile with extended fields | Module: User Profile |
| Full-featured dashboard with analytics | Module: Dashboard |
| Report generation | Module: Reporting |

**The test:** if a project using Socle+ but zero modules can run and be administered, and it does nothing business-specific, then Socle+ is correctly scoped.

---

## 4. Boundary with Modules

This boundary is the most commonly violated one and must be defined with precision.

### The Rule
Socle+ provides **infrastructure** for features. Modules provide the **features themselves**.

### Examples

| Scenario | Socle+ provides | Module provides |
|---|---|---|
| A user can log in | Auth lifecycle, session, password hash | (nothing needed) |
| An editor can manage posts | Role "editor" exists, permissions check | CMS module: posts CRUD, admin section |
| A product has an owner user | User entity, FK capability | Commerce module: product model, ownership |
| An admin sees all bookings | Admin shell chrome, auth guard | Booking module: booking list admin page |

### The Signal for Misplacement
If you find yourself writing domain-specific logic (posts, orders, appointments) inside Socle+, it is misplaced. Push it down to its module.

If you find yourself instantiating a database connection or checking permissions inside a module without going through Socle+'s interfaces, you have tight coupling. Pull it back up to Socle+.

---

## 5. Admin Shell Design Principles

The admin shell in Socle+ is intentionally minimal. It is a container, not a framework.

- Modules register navigation items, not Socle+
- Socle+ renders the frame; modules render the content
- No module should break the admin shell if it fails — modules are isolated in the shell
- The admin shell has no awareness of business entities
- Access to the admin shell requires authentication and a minimum role — defined by Socle+

---

## 6. Activation Model

Socle+ is activated at the project level, not at the platform level. Projects declare:

```
uses: socle+
modules: [cms, blog]
```

This declaration (however it is implemented technically) must be explicit. Implicit activation by detecting a database config is an anti-pattern — it hides the architectural decision.

---

## 7. Design Constraints

- **Socle+ must be operable with no modules activated.** A fresh Socle+ project must boot, connect to a database, and show the admin shell (empty) without any module.
- **Socle+ must not leak into Socle.** A Socle-only project must compile and run without pulling in any Socle+ dependency.
- **Socle+ user model must be minimal and extensible.** Adding user profile fields must be a module concern, not a Socle+ patch.
- **Socle+ is stable.** Like Socle, once established it changes only for infrastructure reasons.
