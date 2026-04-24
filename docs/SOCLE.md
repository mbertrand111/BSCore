# SOCLE — Minimal Foundation

## 1. What Socle Is

Socle is the irreducible core of the BSCore platform. It is the foundation every project — regardless of complexity — is built on. It provides the minimum infrastructure needed to run a functional web project without database, authentication, or administration.

Socle answers one question: **"What does every project absolutely need, and nothing more?"**

---

## 2. What Belongs in Socle

### 2.1 Environment & Configuration
- Environment variable loading and validation (e.g., `.env` management)
- Environment-specific configuration (development, staging, production)
- Access to configuration values via a typed, centralized interface
- **NOT** business-domain configuration (that belongs to modules or client-specific)

### 2.2 Routing Foundation
- Base routing setup (not routes themselves — those are project-specific)
- Route grouping conventions
- Middleware chain initialization
- Basic request/response lifecycle

### 2.3 Error Handling
- Global error handler (catches unhandled exceptions)
- Standard error response format (to be consistent across all layers)
- Basic HTTP error codes (404, 500, etc.)

### 2.4 Logging
- Structured logging interface (not a specific logger implementation)
- Log level management per environment
- Enough to trace requests and errors without business-level instrumentation

### 2.5 Security Baseline
- HTTP security headers (CSP, X-Frame-Options, HSTS, etc.)
- CORS configuration
- Basic rate limiting at the infrastructure level (not domain-level throttling)
- Input sanitization utilities (without business-rule validation logic)

### 2.6 Static Asset Handling
- Serving static files (CSS, JS, images)
- Cache headers for static assets
- Asset path helpers

### 2.7 Utilities and Shared Helpers
- Date/time formatting utilities
- String manipulation helpers
- URL construction helpers
- Shared constants (HTTP status codes, etc.)
- **NOT** domain-specific utilities (those belong to their module)

### 2.8 Health & Diagnostics
- A `/health` or `/status` endpoint that returns the application state
- No business logic in this endpoint — purely infrastructure signal

---

## 3. What Must NOT Be in Socle

This section is as important as the previous one. Including the following in Socle is an anti-pattern.

| Not in Socle | Belongs In |
|---|---|
| Database connection / ORM | Socle+ |
| Authentication / sessions | Socle+ |
| Role or permission logic | Socle+ |
| Admin interface or shell | Socle+ |
| User model or user management | Socle+ |
| Any CMS or content concept | Module: CMS |
| Any form handling or submission | Module: Forms |
| Email sending logic | Module: Email / Notifications |
| Any business-domain model | Module or Client-specific |
| SEO management | Module: SEO |
| Multi-language / i18n | Module: i18n |
| Analytics tracking | Module: Analytics |
| Any client-specific logic | Client-specific layer |

**Rule of thumb:** if removing it would break a project that has no database and no admin panel, it belongs in Socle. If not, it does not.

---

## 4. Use Cases for Socle-Only Projects

Socle alone is sufficient for:

- **Single-page landing sites** (marketing pages, event pages, campaign microsites)
- **Static vitrine websites** (company presentation, portfolio, services page)
- **Documentation sites** (developer docs, internal wikis with no auth)
- **Redirect or proxy utilities** (lightweight routing tools)
- **Simple contact pages** with a third-party form service (e.g., Typeform, HubSpot embed)

Socle is NOT sufficient for:
- Any project that stores data in a database
- Any project that has a login or user account feature
- Any project with an administration panel
- Any project with content managed through a back-office

---

## 5. Technical Responsibilities of Socle

Socle is responsible for the following technical contracts that all upper layers rely on:

### 5.1 Application Bootstrapping
Socle defines the application startup sequence. Other layers hook into this lifecycle but do not replace it. The boot order must be deterministic and observable.

### 5.2 Configuration Contract
All layers access configuration through the interface Socle exposes. No layer reads environment variables directly — they consume the configuration object Socle provides. This centralizes validation and prevents scattered `process.env` access.

### 5.3 Error Contract
Socle defines the error response shape. All modules and client extensions must produce errors conforming to this shape. This ensures predictable error handling across the entire stack.

### 5.4 Logging Contract
Socle defines the logging interface. Modules and extensions call `logger.info()`, `logger.error()`, etc. — they do not instantiate their own loggers. This allows centralized log routing, formatting, and level control.

### 5.5 Middleware Pipeline
Socle owns the middleware pipeline. Modules register their middleware through Socle's extension point. Modules do not manipulate the pipeline directly.

---

## 6. Design Constraints

- **Socle must have zero database dependencies.** Any project using only Socle must be deployable to a static host or serverless function with no DB.
- **Socle must not make assumptions about the front-end framework.** It serves contracts, not HTML.
- **Socle's footprint must stay measurable.** If a Socle-only project exceeds a defined bundle/startup threshold, something has been added that should not be there.
- **Socle is stable.** Once established, it changes only for infrastructure-level reasons (security patches, dependency upgrades). Business-driven changes never touch Socle.
