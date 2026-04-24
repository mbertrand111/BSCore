# MODULES — Functional Blocks Catalog

## 1. Module Design Principles

Before the catalog, these rules apply to ALL modules without exception:

- **One module = one bounded domain.** A module does not stretch across multiple business domains.
- **No direct module-to-module imports.** Inter-module communication happens through declared dependencies, public interfaces, or events — never direct code imports. A module may declare an explicit dependency on another module (e.g., Orders depends on Commerce), but must interact with it only through its public interface, not its internals.
- **Modules declare their full dependency list:** they require either Socle (no DB, no auth) or Socle+ (DB + auth needed), and optionally other modules they depend on. All dependencies are explicit — no hidden assumptions.
- **Modules own their data.** A module's tables, models, and migrations belong to that module alone. Other modules do not query them directly.
- **Modules register themselves.** They do not get wired in manually. They expose a registration interface that the activation mechanism calls.
- **Modules are removable.** Deactivating a module must not break the base system or other modules that do not declare a dependency on it.

**Note on module stacks:** Some modules form natural groups where one depends on another. Commerce + Orders + Payments form a "commerce stack". Booking + Notifications is a common pairing. Within a stack, modules declare their dependencies explicitly — but the no-direct-import rule still applies. The dependency is declared in the manifest; the interaction is through the depended-on module's public interface. Stack membership is a documentation-level concept; each module remains individually defined and independently testable.

---

## 2. Module Status Legend

| Status | Meaning |
|---|---|
| MVP | Must exist before the first real project ships |
| Phase 2 | Needed soon, not on day one |
| Later | Valuable but not time-sensitive |
| Deferred | Interesting but not yet evaluated |

---

## 3. Content Modules

Modules for creating, organizing, and publishing content.

---

### Module: CMS (Content Management System)

**Purpose:** Manage structured content pages with an editor. Allows non-technical users to create and update website content without touching code.

**Scope:**
- Content types (pages, sections, reusable blocks)
- Rich text editing
- Slug management and URL structure
- Content versioning (drafts / published states)
- Admin section: content tree, page editor

**Depends on:** Socle+

**Status:** MVP

**Boundaries:**
- Does NOT handle media files (see Module: Media)
- Does NOT handle SEO metadata (see Module: SEO)
- Does NOT handle blog posts or news (see Module: Blog)

---

### Module: Blog

**Purpose:** Publish and manage editorial content (articles, news, posts) with author attribution, categories, and tags.

**Scope:**
- Post creation, editing, publishing, scheduling
- Categories and tags
- Author association (from Socle+ users)
- RSS feed generation
- Admin section: post list, post editor

**Depends on:** Socle+

**Status:** MVP

**Boundaries:**
- Does NOT manage static pages (see Module: CMS)
- Does NOT send notifications on publish (see Module: Notifications)
- Comments are out of scope at this level — add as sub-module or client-specific

---

### Module: Media Library

**Purpose:** Centralized management of uploaded files: images, documents, videos.

**Scope:**
- File upload, storage reference, metadata
- Image resizing and optimization hints
- Folder/collection organization
- Admin section: media browser
- Used by other modules (CMS, Blog, Commerce) as a shared asset source

**Depends on:** Socle+

**Status:** MVP

**Boundaries:**
- Storage backend (local disk, S3, etc.) is a configuration concern, not a module concern
- Does NOT manage video streaming or CDN logic

---

### Module: SEO

**Purpose:** Manage meta tags, Open Graph, structured data, and sitemap generation per page.

**Scope:**
- Per-page SEO fields (title, description, canonical URL, robots directives)
- Open Graph and Twitter Card metadata
- JSON-LD structured data helpers
- XML sitemap auto-generation
- Integration points for CMS and Blog modules

**Depends on:** Socle (no auth needed for front-end rendering) / Socle+ for admin editing

**Status:** MVP

**Boundaries:**
- Does NOT handle analytics tracking (see Module: Analytics)
- Does NOT manage redirects at scale (see Module: Redirects)

---

### Module: i18n (Internationalization)

**Purpose:** Multi-language support for content and interface strings.

**Scope:**
- Language detection and switching
- Translation strings management
- Content translation workflow (per-language content variants)
- URL locale prefixing (e.g., `/fr/`, `/en/`)

**Depends on:** Socle for string translations; Socle+ if admin editing of translations is needed

**Status:** Phase 2

**Boundaries:**
- Does NOT handle currency localization (see Module: Commerce)
- Does NOT handle regional date/time (handled by Socle utilities)

---

### Module: Redirects

**Purpose:** Manage URL redirects (301/302) without code changes.

**Scope:**
- Redirect rules management (source → destination, status code)
- Wildcard and pattern-based redirects
- Admin section: redirect table editor
- Import/export from CSV

**Depends on:** Socle+

**Status:** Phase 2

---

## 4. Conversion Modules

Modules for capturing leads, subscriptions, and engagement.

---

### Module: Forms

**Purpose:** Create, display, and process custom forms with submission storage and notification.

**Scope:**
- Form builder (field types: text, email, select, checkbox, file upload, etc.)
- Form rendering on the front-end (contract, not UI)
- Submission storage and admin review
- Spam protection (honeypot, CAPTCHA integration)
- Admin section: form list, field editor, submission viewer

**Depends on:** Socle+

**Status:** MVP

**Boundaries:**
- Does NOT send complex notification workflows (see Module: Notifications)
- Does NOT manage marketing lists from submissions (see Module: Email Marketing)
- File upload in forms relies on Module: Media Library

---

### Module: Newsletter / Email Marketing

**Purpose:** Manage subscriber lists, campaigns, and email sends.

**Scope:**
- Subscriber opt-in / opt-out management
- List segmentation
- Campaign creation (template + recipients)
- Send scheduling and history
- Integration with an external email provider (Mailchimp, Brevo, etc.) — not an internal SMTP engine

**Depends on:** Socle+

**Status:** Phase 2

**Boundaries:**
- Does NOT replace a dedicated ESP (Email Service Provider) — it wraps one
- Does NOT handle transactional emails (see Module: Notifications)

---

### Module: Notifications

**Purpose:** Send transactional messages (email, SMS, push) triggered by system events.

**Scope:**
- Notification template management
- Event-to-notification mapping
- Multi-channel dispatch (email, SMS, webhook)
- Notification history log

**Depends on:** Socle+

**Status:** Phase 2

**Boundaries:**
- Does NOT manage marketing campaigns (see Module: Newsletter / Email Marketing)
- Transport providers (SMTP, SMS gateway) are configuration, not module logic

---

### Module: Popups & Banners

**Purpose:** Display contextual messages, promotional banners, or cookie consent.

**Scope:**
- Message creation with display rules (page, timing, frequency)
- Cookie consent banner with consent storage
- Admin section: banner editor and activation

**Depends on:** Socle (display only) / Socle+ if admin-managed

**Status:** Later

---

## 5. Service Modules

Modules for delivering services directly to end-users.

---

### Module: Booking & Reservations

**Purpose:** Allow users to book time slots, appointments, or resources.

**Scope:**
- Resource/service definition (what can be booked)
- Availability calendar management
- Booking request / confirmation workflow
- Cancellation and rescheduling logic
- Admin section: calendar view, booking management

**Depends on:** Socle+

**Status:** Phase 2

**Boundaries:**
- Does NOT handle payments (see Module: Payments)
- Does NOT send reminders (delegates to Module: Notifications)

---

### Module: Events

**Purpose:** Create and manage public events with registration.

**Scope:**
- Event creation (date, location, capacity, description)
- Attendee registration
- Waiting list management
- Admin section: event list, attendee management

**Depends on:** Socle+

**Status:** Phase 2

**Boundaries:**
- Does NOT handle ticket sales or paid events (see Module: Commerce + Module: Payments)
- Does NOT send reminders natively (delegates to Module: Notifications)

---

### Module: FAQ & Knowledge Base

**Purpose:** Publish structured Q&A content for self-service support.

**Scope:**
- Category and question management
- Search within FAQ
- Admin section: FAQ editor

**Depends on:** Socle+ (if admin-managed) or Socle (if static)

**Status:** Later

---

## 6. Commerce Modules

Modules for selling products or services.

---

### Module: Commerce (Product Catalog)

**Purpose:** Manage a product catalog with variants, pricing, and inventory.

**Scope:**
- Product and category management
- Variant management (size, color, etc.)
- Pricing with optional promotions
- Stock tracking
- Admin section: product editor, inventory view

**Depends on:** Socle+

**Status:** Phase 2

**Boundaries:**
- Does NOT handle checkout or orders alone — requires Module: Orders
- Does NOT handle payment processing — requires Module: Payments

---

### Module: Orders

**Purpose:** Manage the cart, checkout, and order lifecycle.

**Scope:**
- Cart management (add, remove, update)
- Checkout flow (address, shipping selection, order summary)
- Order status lifecycle (pending → confirmed → shipped → delivered)
- Admin section: order list, order detail

**Depends on:** Socle+; declares explicit dependency on Module: Commerce (reads product data through Commerce's public interface only)

**Status:** Phase 2

**Boundaries:**
- Commerce and Orders are tightly related but intentionally separated to allow catalog-only use cases (Commerce without Orders)
- Does NOT handle payment capture — delegates to Module: Payments

---

### Module: Payments

**Purpose:** Process payments via one or more payment providers.

**Scope:**
- Payment intent creation
- Payment provider abstraction (Stripe, PayPal, Mollie, etc.)
- Webhook handling for payment confirmation
- Refund processing
- Admin section: payment history, refund actions

**Depends on:** Socle+

**Status:** Phase 2

**Boundaries:**
- Does NOT implement provider SDKs inside the module — wraps them via an adapter
- Does NOT manage subscriptions (see Module: Subscriptions)

---

### Module: Subscriptions

**Purpose:** Manage recurring billing and subscription plans.

**Scope:**
- Plan definition (billing interval, price)
- Subscription lifecycle (trial, active, paused, cancelled)
- Renewal and billing integration with Module: Payments
- Admin section: subscriber list, plan editor

**Depends on:** Socle+; declares explicit dependency on Module: Payments (triggers billing through Payments' public interface only)

**Status:** Later

---

## 7. Relationship Modules

Modules for managing people and structured relationships with the platform.

---

### Module: User Profile

**Purpose:** Extend the minimal Socle+ user with a public or private profile.

**Scope:**
- Profile fields (name, avatar, bio, etc.)
- Profile editing by the user (front-end)
- Admin section: user list with profile data

**Depends on:** Socle+

**Status:** MVP (required for most Socle+ projects)

**Boundaries:**
- Does NOT replace the Socle+ user entity — it extends it
- Avatar storage delegates to Module: Media Library

---

### Module: CRM (Customer Relationship Management)

**Purpose:** Track client interactions, manage contacts and pipelines.

**Scope:**
- Contact record management (individual or company)
- Interaction history (calls, emails, notes)
- Pipeline stages (lead → opportunity → client)
- Admin section: contact list, interaction log, pipeline view

**Depends on:** Socle+

**Status:** Later

---

### Module: Social Auth

**Purpose:** Allow users to authenticate via third-party providers (Google, GitHub, etc.)

**Scope:**
- OAuth2 provider configuration
- Account linking (social identity ↔ Socle+ user)
- First-time registration via social login

**Depends on:** Socle+

**Status:** Phase 2

---

### Module: 2FA (Two-Factor Authentication)

**Purpose:** Add a second authentication factor to Socle+ login.

**Scope:**
- TOTP (authenticator app) setup and verification
- Backup codes
- Admin section: 2FA enforcement policy per role

**Depends on:** Socle+

**Status:** Later

---

## 8. Infrastructure & Analytics Modules

---

### Module: Analytics

**Purpose:** Integrate privacy-respecting analytics tracking on the front-end.

**Scope:**
- Script injection for analytics providers (Matomo, Plausible, GA4, etc.)
- Event tracking helpers
- Admin section: basic reporting view (or embed from provider)

**Depends on:** Socle (script injection) / Socle+ if admin view is required

**Status:** Phase 2

---

### Module: API Gateway

**Purpose:** Expose authenticated API endpoints for external consumption.

**Scope:**
- API key management (create, revoke, scope)
- Rate limiting per API key
- Request logging
- Admin section: API key list, usage stats

**Depends on:** Socle+

**Status:** Later

---

## 9. Summary Table

| Module | Category | Depends On | Status |
|---|---|---|---|
| CMS | Content | Socle+ | MVP |
| Blog | Content | Socle+ | MVP |
| Media Library | Content | Socle+ | MVP |
| SEO | Content | Socle / Socle+ | MVP |
| i18n | Content | Socle / Socle+ | Phase 2 |
| Redirects | Content | Socle+ | Phase 2 |
| Forms | Conversion | Socle+ | MVP |
| Newsletter / Email Marketing | Conversion | Socle+ | Phase 2 |
| Notifications | Conversion | Socle+ | Phase 2 |
| Popups & Banners | Conversion | Socle / Socle+ | Later |
| Booking & Reservations | Service | Socle+ | Phase 2 |
| Events | Service | Socle+ | Phase 2 |
| FAQ & Knowledge Base | Service | Socle / Socle+ | Later |
| Commerce (Catalog) | Commerce | Socle+ | Phase 2 |
| Orders | Commerce | Socle+ + Commerce | Phase 2 |
| Payments | Commerce | Socle+ | Phase 2 |
| Subscriptions | Commerce | Socle+ + Payments | Later |
| User Profile | Relationship | Socle+ | MVP |
| CRM | Relationship | Socle+ | Later |
| Social Auth | Relationship | Socle+ | Phase 2 |
| 2FA | Relationship | Socle+ | Later |
| Analytics | Infrastructure | Socle / Socle+ | Phase 2 |
| API Gateway | Infrastructure | Socle+ | Later |
