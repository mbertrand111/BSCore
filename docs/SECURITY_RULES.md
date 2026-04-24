# SECURITY RULES — BSCore

Security in BSCore is strict but realistic. The goal is not "zero risk" — that is not achievable. The goal is to minimize risks systematically, enforce secure patterns by default, and make remaining risks explicit and tracked.

Any implementation that accepts a security trade-off must document it clearly as a remaining risk in the quality report.

---

## 1. Environment Variables and Secrets

- All secrets (database credentials, API keys, JWT secrets, OAuth tokens, SMTP passwords) live in environment variables only.
- Never hardcode secrets in source code, configuration files, or migration files.
- `.env` is in `.gitignore`. It never enters the repository.
- `.env.example` lists all required variables with placeholder values and a one-line description of each. No real values ever appear in `.env.example`.
- Access secrets only through the centralized configuration object (Socle). Never call `process.env.MY_SECRET` from a module or component.
- Different secrets per environment (development, staging, production). Never share production secrets with development environments.
- Rotate secrets immediately when they are accidentally exposed (committed, logged, shared). Treat accidental exposure as a security incident.

---

## 2. Server / Client Boundary

- Server-side secrets must never appear in the client bundle. This includes: API keys for third-party services, database credentials, internal service URLs, signing keys.
- In SSR frameworks (Next.js, Nuxt, etc.), be explicit about what runs on the server vs the client. Use framework conventions (`server-only`, `use server`, etc.) to enforce this.
- API responses must never include internal identifiers, stack traces, database error messages, or fields not explicitly intended for the client.
- Sensitive server-side logic (permission checks, payment processing, file validation) never trusts client-supplied decisions. Re-validate everything server-side.

---

## 3. Authentication

- Authentication is implemented in Socle+ only. No module re-implements its own auth.
- Passwords are hashed using a strong adaptive algorithm (bcrypt or Argon2). Never store plain-text or reversibly-encrypted passwords.
- Session tokens are cryptographically random, sufficiently long (minimum 128 bits of entropy), and stored server-side or signed with a strong secret.
- Sessions have a defined expiry. Inactive sessions expire after a reasonable timeout.
- Failed login attempts are rate-limited. After a configurable threshold, introduce a delay or lockout.
- Password reset tokens are single-use, time-limited (≤ 1 hour), and invalidated after use.
- "Remember me" sessions use a separate, longer-lived token with a different expiry policy. Invalidate them on password change.
- Login errors return a generic message: "Invalid credentials." — never "wrong password" vs "user not found".

---

## 4. Authorization

- Authorization checks happen server-side on every request. Never trust client-supplied role or permission claims.
- Use the `can(user, action, resource)` interface provided by Socle+. No inline permission logic scattered in route handlers.
- Apply the least privilege principle: users have access only to the minimum set of resources they need for their role.
- Privilege escalation paths (role promotion, admin creation) require elevated authentication — not just any authenticated session.
- Accessing another user's data requires explicit ownership or role check. Never rely solely on filtering by a user-supplied ID.

---

## 5. Admin Routes

- All admin routes are protected by authentication and a minimum role check at the router level. No admin route is accidentally public.
- Admin middleware is registered at the Socle+ level. Modules do not implement their own admin auth.
- Admin-only API endpoints are prefixed consistently (`/admin/...`) and covered by a dedicated middleware group.
- Admin actions that affect user data (delete, role change, deactivation) are logged in the audit log.

---

## 6. Input Validation

- Validate all external inputs at the HTTP layer using a schema library (Zod).
- Validation covers: presence, type, format, length, allowed values, array bounds.
- Do not trust: URL parameters, query strings, request bodies, headers, cookies, file names, file content types, file sizes.
- Return structured validation errors with human-readable messages. Never return raw schema error objects.
- Whitelist allowed values where possible. Avoid blacklist-only approaches.
- Never pass unvalidated user input to: database queries, file system operations, shell commands, URL redirects, HTML rendering.

---

## 7. XSS Prevention

- Never insert user-supplied content into HTML without escaping.
- Use framework-provided safe rendering methods (React's JSX, Vue's `{{ }}` syntax) as the default. Flag any use of raw HTML insertion (`dangerouslySetInnerHTML`, `v-html`) for explicit review.
- Apply a strict Content Security Policy (CSP) header on all responses. Define it in Socle's security baseline.
- Rich text content (from CMS or Blog modules) must be sanitized through a trusted HTML sanitizer before storage and before rendering. Do not rely on output-time sanitization alone.
- Sanitize and encode all data that appears in: HTML attributes, JavaScript string contexts, URL parameters, CSS values.

---

## 8. CSRF Protection

- State-changing requests (POST, PUT, PATCH, DELETE) from browser clients require CSRF protection when using cookie-based sessions.
- Use the double-submit cookie pattern or a framework-provided CSRF token mechanism.
- API endpoints intended for programmatic access (token-authenticated, not cookie-authenticated) do not require CSRF tokens, but must validate the `Authorization` header correctly.
- Verify the `Origin` or `Referer` header as a secondary check on sensitive mutations.

---

## 9. SQL Injection Prevention

- Never construct SQL queries through string concatenation with user input.
- Use parameterized queries or the ORM's query builder for all database operations.
- If raw SQL is needed (complex queries, migrations), parameters must still be passed separately — never interpolated into the string.
- Review all raw SQL queries for injection vectors before merge.

---

## 10. File Uploads

- Validate on the server: file size (enforce a maximum), MIME type (check against an allowlist, not just the filename extension), filename (sanitize — strip path traversal characters, normalize).
- Never serve uploaded files from a publicly-accessible path that allows script execution.
- Store uploaded files outside the web root, or use a dedicated object storage service (S3, etc.).
- Never trust the `Content-Type` header supplied by the client. Detect the real MIME type using the file content.
- Generate a random, opaque filename for stored files. Do not use the original filename as the storage path.
- Virus/malware scanning is recommended for public-facing uploads. Flag as a remaining risk if not implemented.

---

## 11. Redirects

- Validate all redirect targets before redirecting. Only redirect to allowed, whitelisted destinations.
- Never redirect to a URL directly supplied by the user without validation (open redirect vulnerability).
- After authentication, redirect to a stored path only if it is relative and on the same origin. Strip absolute URLs or external destinations from post-login redirect parameters.

---

## 12. Error Messages and Logging

- Error messages shown to users are generic and non-revealing: no stack traces, no database details, no file paths, no internal identifiers.
- Full error details are logged server-side for diagnostics.
- Logs must never contain: passwords, tokens, credit card numbers, full session IDs, personally identifiable information in plaintext.
- Use structured logging. Tag sensitive fields as redacted when logging request data.
- Log all security-relevant events: login, logout, failed login, password change, role change, admin action, permission denial.

---

## 13. Security Headers

Applied by Socle's security baseline to all responses:

| Header | Value |
|---|---|
| `Content-Security-Policy` | Strict policy; defined per project |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (production) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Disable unused browser features |

Review headers using securityheaders.com before going to production.

---

## 14. Dependency Hygiene

- Run `npm audit` (or equivalent) before each release. Critical vulnerabilities block the release.
- Keep dependencies up to date. Schedule regular dependency review (at minimum monthly).
- Evaluate new dependencies before adding: maintenance status, known CVEs, license compatibility.
- Use lock files (`package-lock.json` or `yarn.lock`) committed to the repository. Pinned production versions.
- Do not install development-only packages as production dependencies.

---

## 15. Access Control Summary

| Resource | Who can access |
|---|---|
| Public pages | Everyone |
| Authenticated pages | Any logged-in user |
| Own data (profile, bookings) | The owning user only |
| Module admin sections | Minimum required role (defined per module) |
| Super-admin functions | Super-admin role only |
| Server-side secrets | Server process only — never client |
| Audit logs | Super-admin only |

---

## 16. Commerce and Payment-Sensitive Features

When Commerce or Payments modules are activated:

- Never log or store full payment card data. Use tokenization from the payment provider.
- Webhook endpoints from payment providers must verify the provider's signature before processing.
- Order state transitions (e.g., "mark as paid") must be triggered by verified webhook events, not by client-supplied confirmation.
- Payment amounts must be calculated server-side from authoritative product data. Never trust the client-supplied price.
- Flag PCI-DSS scope early. Minimizing scope (using hosted payment pages) is strongly recommended.

---

## 17. Reporting Remaining Risks

When a security rule cannot be fully satisfied (time constraint, third-party limitation, deferred feature), document it explicitly:

```
## Remaining Risk: [short title]
**Description:** What is not fully secured and why.
**Impact:** What could happen if exploited.
**Mitigation in place:** What partially reduces the risk.
**Resolution plan:** What needs to be done and by when.
```

This entry goes in the quality report and in a `RISKS.md` file tracked in the repository.
