# QUALITY CHECKLIST — BSCore

Use this checklist after every implementation before marking a task complete.
It is not a ceremony — it is a fast, honest review. Check each item, note failures.

---

## How to Use

Go through each section. For each item:
- ✅ Pass — fully satisfied
- ⚠️ Partial — mostly satisfied, known gap (document it)
- ❌ Fail — not satisfied (must be resolved before shipping)
- N/A — genuinely not applicable to this implementation

If any item is ❌, the implementation is not ready to ship.
If any item is ⚠️, document it explicitly as a remaining risk.

---

## 1. Architecture

- [ ] Code belongs to the correct layer (Socle / Socle+ / Module / Client-specific)
- [ ] No layer violates the dependency direction (lower layers have no knowledge of upper layers)
- [ ] HTTP, Domain, and Data layers are separated within the module
- [ ] No business logic in the HTTP layer (controllers, route handlers)
- [ ] No HTTP or database context in the Domain layer
- [ ] No business logic in the Data layer (repositories)
- [ ] Public-facing pages and admin interfaces are clearly separated

---

## 2. Boundaries

- [ ] No direct import from one module into another
- [ ] Module dependencies are declared explicitly, not implicit
- [ ] Communication between modules uses declared interfaces or events only
- [ ] Client-specific code is in the client-specific directory, not inside a module
- [ ] No Socle+ concepts (DB, auth) imported into Socle
- [ ] No domain concepts (business entities) added to Socle+

---

## 3. Modularity

- [ ] The module exposes a deliberate public interface (its index export)
- [ ] Internal module code is not exported outside the module
- [ ] The module registers itself (routes, admin nav, migrations, events) through the activation mechanism
- [ ] Deactivating this module would not break other modules that don't depend on it
- [ ] Module migrations are inside the module directory

---

## 4. TypeScript Quality

- [ ] Strict mode is satisfied — no `any`, no type assertions without comment
- [ ] All exported functions have explicit return types
- [ ] `null` and `undefined` are handled explicitly — no `!` assertions without justification
- [ ] No `@ts-ignore` without a comment and a tracking note
- [ ] `tsc --noEmit` passes with no errors
- [ ] No unused variables, imports, or exports

---

## 5. Security

- [ ] All external inputs are validated with a schema (Zod) at the HTTP layer
- [ ] No user-supplied data is passed unvalidated to DB queries, file system, or HTML
- [ ] Secrets are accessed through the centralized config object — no raw `process.env` in module code
- [ ] No secret, token, or stack trace is returned in any API response
- [ ] Authentication is checked on all protected routes
- [ ] Authorization (role/permission check) is applied where data ownership matters
- [ ] File uploads: size, MIME type, and filename are validated server-side
- [ ] Redirects target only whitelisted or same-origin destinations
- [ ] Error messages returned to the client are generic and non-revealing
- [ ] Logs contain no passwords, tokens, full session IDs, or PII in plaintext
- [ ] CSP and security headers are not weakened by this implementation
- [ ] If any security rule was not fully satisfied: documented as a remaining risk

---

## 6. Tests

- [ ] Domain logic has unit tests covering the happy path
- [ ] Domain logic has unit tests covering main failure cases and edge cases
- [ ] Integration tests cover service + data layer interactions
- [ ] Security controls have a test that verifies rejection of unauthorized/malformed input
- [ ] If a bug was fixed: a regression test was written before the fix
- [ ] All tests pass
- [ ] No test relies on another test's side effects
- [ ] Test data is deterministic (no random values unless testing randomness)

---

## 7. UX (Admin / Backoffice)

*Skip if the implementation has no UI.*

- [ ] Loading state is handled — no blank screen during data fetch
- [ ] Empty state is handled — no silent empty list
- [ ] Error state is handled — failure is communicated clearly to the user
- [ ] Success feedback is given after mutations
- [ ] Destructive actions require confirmation before execution
- [ ] Confirmation dialog names the specific item being affected
- [ ] Form validation errors are inline, specific, and actionable
- [ ] Form values are preserved on validation failure
- [ ] Submit button is disabled during submission to prevent double-submit
- [ ] Interface language is non-technical and uses domain vocabulary

---

## 8. Accessibility

*Skip if the implementation has no UI.*

- [ ] All form fields have associated `<label>` elements
- [ ] All interactive elements are keyboard-navigable
- [ ] Focus state is visible on all interactive elements
- [ ] All images have `alt` attributes (decorative images use `alt=""`)
- [ ] Color is not the only indicator of state (error, success, selected)
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Icon-only buttons have `aria-label`
- [ ] Modal dialogs trap focus and return focus on close

---

## 9. SEO

*Only applies to public-facing pages.*

- [ ] Page has a unique `<title>` (under 60 characters)
- [ ] Page has a unique `<meta name="description">` (120–160 characters)
- [ ] Page has exactly one `<h1>`
- [ ] Heading hierarchy is logical
- [ ] Semantic HTML elements are used correctly
- [ ] `<link rel="canonical">` is present and correct
- [ ] Images have `width`, `height`, and `alt` attributes
- [ ] Critical content is in the HTML source (not JS-only rendered)
- [ ] Open Graph tags are present if the page may be shared socially
- [ ] Noindex pages are intentionally marked noindex

---

## 10. Performance

*Applies to pages and operations with meaningful performance impact.*

- [ ] No synchronous blocking operations in request handlers
- [ ] Database queries are not executed in loops (N+1 query problem)
- [ ] Heavy computations are not done on the main thread / request cycle
- [ ] Images are appropriately sized for their display context
- [ ] No render-blocking scripts in `<head>` of public pages
- [ ] Response includes appropriate cache headers for static or rarely-changing content

---

## 11. Maintainability

- [ ] No function exceeds ~50 lines without a strong reason
- [ ] No file exceeds ~300 lines without a strong reason
- [ ] No "utils.ts" catch-all files — functions are named and placed by purpose
- [ ] Comments explain WHY, not WHAT
- [ ] No commented-out code
- [ ] No TODO without a tracking note
- [ ] No dead code (unreachable branches, unused exports)

---

## 12. Documentation

- [ ] If the architecture changed: relevant `/docs` files are updated in this same PR
- [ ] If the module's public interface changed: the change is reflected in the module index
- [ ] If a new event was added: it is documented (emitter, listeners, purpose)
- [ ] If a new environment variable is required: it is added to `.env.example` with a description
- [ ] If a security trade-off was made: it is documented as a remaining risk

---

## 13. Remaining Risks

List any items that are ⚠️ Partial or could not be fully resolved.

For each:

```
## Remaining Risk: [short title]
**Description:** What is not fully covered and why.
**Impact:** What could go wrong.
**Mitigation in place:** What partially reduces the risk.
**Resolution plan:** What needs to happen and by when.
```

If there are no remaining risks, write: **No remaining risks identified.**

---

## Quick Sign-Off Format

At the end of a quality report, summarize with:

```
## Quality Report

Architecture:     ✅ / ⚠️ [note] / ❌ [blocker]
Boundaries:       ✅ / ⚠️ [note] / ❌ [blocker]
TypeScript:       ✅ / ⚠️ [note] / ❌ [blocker]
Security:         ✅ / ⚠️ [note] / ❌ [blocker]
Tests:            ✅ / ⚠️ [note] / ❌ [blocker]
UX:               ✅ / N/A
Accessibility:    ✅ / N/A
SEO:              ✅ / N/A
Performance:      ✅ / ⚠️ [note]
Maintainability:  ✅ / ⚠️ [note]
Documentation:    ✅ / ⚠️ [note]
Remaining risks:  None / [list]
```
