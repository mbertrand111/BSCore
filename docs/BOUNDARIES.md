# BOUNDARIES — Strict Rules for Layer Separation

## 1. Purpose

This document is the enforcement reference for architectural decisions. When in doubt about where something belongs, this document provides the rule, an example, and the rationale. It should be consulted during code review, planning, and onboarding.

---

## 2. Boundary: Socle vs Socle+

### The Rule
**Socle** contains what is needed to run a project with no database and no authenticated users.
**Socle+** contains what is needed to add a database, authentication, and a management interface.

If a feature requires a database or a user identity to function, it belongs in Socle+ or above — never in Socle.

### Decision Table

| Question | Answer | Where it goes |
|---|---|---|
| Does it need a database? | Yes | Socle+ minimum |
| Does it need to know who the user is? | Yes | Socle+ minimum |
| Does it need to protect a route from unauthorized access? | Yes | Socle+ minimum |
| Does it need to log a business event to a table? | Yes | Socle+ minimum |
| Can it run on a plain static web server? | Yes | Could be Socle |
| Is it needed by every single project, including no-DB ones? | Yes | Could be Socle |
| Is it needed by most projects but not all? | Yes | Socle+ or a Module |

### Examples of Correct Placement

- HTTP request logging → **Socle** (all projects log requests)
- Environment variable loading → **Socle** (all projects read config)
- Database connection pool → **Socle+** (requires a database)
- User session management → **Socle+** (requires auth infrastructure)
- Role assignment to a user → **Socle+** (requires user model + DB)

### Anti-Patterns to Avoid

**Anti-pattern: Sneaking DB access into Socle**
```
// BAD: Socle/config.ts
import { db } from './database'; // ← database does not exist in Socle
const siteSettings = await db.query('SELECT * FROM settings');
```
> Socle must have zero database imports. If you are importing a DB client in Socle, stop.

**Anti-pattern: Auth logic in Socle middleware**
```
// BAD: Socle/middleware/auth.ts
export function requireLogin(req) {
  if (!req.session.userId) redirect('/login'); // ← session requires Socle+
}
```
> Auth middleware belongs in Socle+. Socle only sets up the middleware pipeline; it does not provide auth guards.

**Anti-pattern: Putting "global settings" (stored in DB) in Socle**
> Settings stored in a database are a Socle+ or Module concern. Socle settings come from environment variables only.

---

## 3. Boundary: Socle+ vs Modules

### The Rule
**Socle+** provides infrastructure (auth, DB access, role system, admin shell framework).
**Modules** provide domain features (content, bookings, orders, profiles).

If a feature implements a business concept (a post, a product, a booking, a form), it belongs in a Module — even if it requires the infrastructure Socle+ provides.

### Decision Table

| Question | Answer | Where it goes |
|---|---|---|
| Does it define a business entity (post, order, booking)? | Yes | Module |
| Does it implement CRUD for a domain object? | Yes | Module |
| Does it add a section to the admin panel? | Yes | Module (registers section into Socle+ shell) |
| Does it add a user-facing feature? | Yes | Module |
| Is it a new type of user (editor, customer, admin)? | Roles → Socle+, behavior → Module |
| Does it provide auth or DB to features? | Yes | Socle+ |
| Is it a shared service other modules will consume? | Yes | Socle+ (if infrastructure) or separate shared module |

### Examples of Correct Placement

- "User can log in" → **Socle+** (auth infrastructure)
- "Editor can create a blog post" → **Module: Blog** (domain feature using Socle+ auth)
- "Admin sees all bookings" → **Module: Booking** (registers admin view; shell from Socle+)
- "User has a name and avatar" → **Module: User Profile** (extends Socle+ minimal user)
- Role "editor" exists → **Socle+** defines role concept; Module: Blog defines that "editor" can publish posts

### Anti-Patterns to Avoid

**Anti-pattern: Domain logic in Socle+**
```
// BAD: socle-plus/posts.ts
export async function createPost(data) {
  return db.insert('posts', data); // ← posts are a Blog module concern
}
```
> Socle+ has no awareness of posts, products, bookings, or any domain entity.

**Anti-pattern: Calling Socle+ DB directly from a module**
```
// BAD: modules/blog/data.ts
import { rawDb } from 'socle-plus/database'; // ← bypasses module data layer
const posts = await rawDb.query('SELECT * FROM posts');
```
> Modules access the database through their own data layer, not by reaching into Socle+'s internals. Socle+ provides the connection; modules use it through their own repositories.

**Anti-pattern: Admin nav items hard-coded in Socle+**
```
// BAD: socle-plus/admin/nav.ts
export const navItems = [
  { label: 'Posts', href: '/admin/posts' }, // ← Blog module's concern
  { label: 'Products', href: '/admin/products' }, // ← Commerce module's concern
];
```
> Socle+ admin nav is a dynamic registry. Modules register their own entries. Socle+ knows nothing about posts or products.

---

## 4. Boundary: Modules vs Client-Specific

### The Rule
**Modules** implement generic, reusable domain features with no knowledge of any specific client.
**Client-specific** code implements behavior unique to one client — behavior that would not make sense in another project.

A feature belongs in a module if it could be useful in at least two projects with no modification. A feature belongs in client-specific code if it encodes business rules, workflows, or integrations that are unique to one client.

### Decision Table

| Question | Answer | Where it goes |
|---|---|---|
| Would this exact feature be useful in another project? | Yes | Module (current or new) |
| Does it reference a specific client's business entity or rule? | Yes | Client-specific |
| Is it a custom integration with a tool only this client uses? | Yes | Client-specific |
| Is it a variation of a module's feature with a parameter? | Yes | Extend the module with a config option |
| Is it a workaround for a client's legacy system? | Yes | Client-specific |
| Does it implement a module's extension point? | Yes | Client-specific |

### Examples of Correct Placement

- "User can book an appointment" → **Module: Booking**
- "User can book a horse riding lesson with a 48h cancellation window specific to Haras Dupont" → **Client-specific: haras-dupont/booking-extension**
- "Product has a price and a SKU" → **Module: Commerce**
- "Product has a wine appellation and a vintage year for Cave Lefebvre" → **Client-specific: cave-lefebvre/product-extension**
- "Send a notification on booking confirmation" → **Module: Notifications** (generic trigger)
- "Send a WhatsApp message to the stable owner on every new booking" → **Client-specific** (bespoke integration)

### Anti-Patterns to Avoid

**Anti-pattern: Client rules inside a module**
```
// BAD: modules/booking/domain/booking.ts
if (clientId === 'haras-dupont') {
  cancellationWindow = 48; // ← client-specific rule polluting a module
}
```
> Modules must not contain client-specific conditions. Use extension points or configuration instead.

**Anti-pattern: Client code modifying module files directly**
```
// BAD: directly editing modules/cms/admin/pages.ts to add a client-specific field
```
> Client code never modifies module files. It uses extension points the module exposes. If the extension point doesn't exist, add one to the module — do not patch the module file from outside.

**Anti-pattern: Promoting client code to a module prematurely**
> A feature should not become a module until it has been proven useful in two or more independent projects without modification. Premature promotion creates modules full of implicit client assumptions.

---

## 5. Boundary: Module vs Module

### The Rule
Modules do not import each other directly. Where a genuine functional dependency exists, it must be declared explicitly and respected through defined interaction patterns only.

There are three valid patterns for inter-module interaction:

1. **Declared dependency + public interface:** Module A declares that it depends on Module B in its manifest. At runtime, Module A calls Module B's public interface only — never its internal functions, data layer, or tables. This pattern is for genuine functional dependencies (e.g., Orders depends on Commerce).
2. **Event system:** Module A emits an event; Module B listens. Neither knows the other exists. Use this for reactions and side-effects, not for data retrieval (e.g., Booking emits `booking.confirmed`; Notifications listens).
3. **Shared sub-module (exceptional):** If two modules share a genuine abstraction that belongs to neither, extract it into a standalone shared module. This should be rare — document the reason explicitly.

**Module stacks** are a legitimate concept: some modules are designed to be used together (Commerce + Orders + Payments form a commerce stack). Within a stack, modules may declare dependencies on each other, but the no-direct-import rule still applies. The dependency is declared in the manifest; the communication is through the depended-on module's public interface.

### Anti-Patterns to Avoid

**Anti-pattern: Direct import of another module's internals**
```
// BAD: modules/orders/domain/order.ts
import { getProduct } from 'modules/commerce/domain/product'; // ← forbidden
```
> Orders may declare a dependency on Commerce, but must never import its internals. It accesses product data through Commerce's public interface only. Direct imports bypass the public interface contract and create tight coupling to internal implementation details.

**Anti-pattern: Shared database tables between modules**
```
// BAD: Blog module reads from the CMS module's pages table directly
const relatedPage = await db.query('SELECT * FROM cms_pages WHERE id = ?', [pageId]);
```
> Modules own their own tables. If Blog needs CMS page data, CMS must expose a service interface that Blog calls — never a raw table query.

---

## 6. Summary: Anti-Patterns Reference

| Anti-Pattern | Why It's Wrong | Correct Approach |
|---|---|---|
| DB access in Socle | Socle must run without a DB | Move to Socle+ or Module |
| Auth logic in Socle | Auth requires user/session infrastructure | Move to Socle+ |
| Domain models in Socle+ | Socle+ is infrastructure, not business | Move to appropriate Module |
| Module directly importing another module's internals | Creates tight coupling to implementation details | Declare dependency explicitly; use module's public interface or events |
| Client conditions inside modules | Pollutes reusable code with specifics | Use module extension points |
| Client code patching module files | Breaks upgrade path and isolation | Add an extension point to the module |
| Hard-coded admin nav in Socle+ | Socle+ can't know about domain features | Modules register nav dynamically |
| Shared DB tables between modules | Breaks module ownership | Modules expose service interfaces |
| Promoting a feature to a module too early | Brings client assumptions into shared code | Wait for proven reuse in 2+ projects |
| "Everything in client-specific" | Defeats the reuse purpose | Extract genuinely reusable features to modules |

---

## 7. The Final Test

When deciding where something goes, apply these three tests in order:

**Test 1 — Infrastructure or Domain?**
Is this providing a runtime capability (routing, auth, DB) or implementing a business feature? Infrastructure → Socle or Socle+. Domain → Module or Client-specific.

**Test 2 — Generic or Specific?**
Could this be used unchanged in two unrelated projects? Generic → Module. Specific → Client-specific.

**Test 3 — Does it belong one layer lower?**
Could a lower layer absorb this without violating its own constraints? If yes, push it down. Always prefer the lowest layer that can own it correctly.

If all three tests are inconclusive, default to Client-specific and promote later when reuse is proven.
