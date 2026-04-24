# TESTING STRATEGY — BSCore

## 1. Philosophy

Tests are written progressively during development, not after. A feature is not complete until it has appropriate test coverage for its risk level. 100% coverage everywhere is not the goal — focused, meaningful coverage is.

Coverage targets are risk-based:

- **High risk** (auth, payments, permissions, data mutations): high coverage requirement, including edge cases and failure paths.
- **Medium risk** (content CRUD, form submission, file upload): good coverage of happy path and main error cases.
- **Low risk** (read-only display logic, static utilities): basic smoke coverage is sufficient.

---

## 2. Test Types

### 2.1 Unit Tests
**What:** Isolated functions, domain services, validation schemas, utilities.
**Scope:** Domain layer only. No HTTP, no database, no external services.
**Rule:** Every domain service function has at least one unit test covering the happy path and at least one covering the main failure case.
**Speed:** Must be fast. No I/O.

### 2.2 Integration Tests
**What:** Services interacting with a real database, module registration, repository behavior, event emission and handling.
**Scope:** Service + data layer, or module-level wiring.
**Rule:** Use a real test database (or in-memory equivalent). No mocks for the database layer — mocking the DB is the most common source of false confidence.
**Speed:** Slower than unit tests. Run on CI, not necessarily on every local save.

### 2.3 End-to-End (E2E) Tests
**What:** Full user flows through the running application, from HTTP request to database and back.
**Scope:** Critical user journeys and admin workflows.
**Rule:** Cover the happy path of every critical flow. Cover the most likely failure paths.
**Tool:** Playwright or Cypress (decision deferred to implementation phase).
**Speed:** Slowest. Run on CI before deployment.

### 2.4 Regression Tests
**What:** A failing test added before fixing every confirmed bug.
**Rule:** When a bug is reported, write a test that reproduces it first. Fix the bug. Confirm the test passes. The test stays in the suite permanently.

### 2.5 Security Tests
**What:** Tests that verify security controls are in place and enforced.
**Rule:** Where a security control exists (auth guard, permission check, input validation), there must be a test that verifies it rejects unauthorized or malformed input.
**Examples:** Unauthenticated request to an admin route returns 401. Injecting a script tag in a form field is sanitized. A user cannot access another user's data by changing an ID.

---

## 3. What to Mock (and What Not to)

| Always mock | Never mock |
|---|---|
| External HTTP APIs (payment providers, email services) | The application's own database layer |
| System time (when testing time-sensitive logic) | Authentication behavior in integration tests |
| Third-party SDKs in unit tests | The module event system |

Use dependency injection to make mocking easy without coupling tests to implementation details.

---

## 4. Coverage by Layer

### Socle
**Focus:** Configuration loading, error contract, logging interface, security headers, middleware pipeline.
**Target:** High. Socle is the foundation — regressions here affect every project.
- Config validation: unit tested for all valid and invalid cases.
- Error response contract: unit tested for shape and status codes.
- Security headers: integration test verifies all required headers are present on responses.
- Middleware order: integration test verifies the pipeline chain executes correctly.

### Socle+
**Focus:** Authentication lifecycle, session management, authorization checks, role enforcement, admin shell registration.
**Target:** High. Auth/authz bugs are high-impact.
- Login / logout: E2E test for the full flow.
- Session expiry: unit test for expiry logic; integration test for rejection of expired token.
- Role check — authorized: integration test confirms access granted.
- Role check — unauthorized: integration test confirms 401/403 returned.
- Admin shell: integration test verifies module nav registration.
- Audit log: integration test verifies events are written on auth actions.

### Module: CMS
**Focus:** Content CRUD, publish/draft state transitions, slug uniqueness.
**Target:** Medium-High.
- Create, read, update, delete content: integration tests.
- Draft → Published transition: unit test for state machine; integration test for persistence.
- Duplicate slug: unit test rejects it; integration test verifies the constraint.
- Admin: E2E test for creating and publishing a page.

### Module: Blog
**Focus:** Post creation, publishing, scheduling, author attribution.
**Target:** Medium-High.
- Post CRUD: integration tests.
- Scheduled publish: unit test for scheduling logic.
- RSS feed generation: integration test verifies feed shape.
- Admin: E2E test for writing and publishing a post.

### Module: Media Library
**Focus:** File upload validation, storage reference creation, metadata.
**Target:** Medium-High. File uploads are a security surface.
- Upload validation (size, type, filename sanitization): unit tests for every validation rule.
- Storage reference creation: integration test.
- Rejection of invalid MIME types: security test.
- Rejection of oversized files: security test.

### Module: SEO
**Focus:** Metadata rendering, sitemap generation, canonical URLs.
**Target:** Medium.
- Meta tag rendering: unit tests for output shape.
- Sitemap generation: integration test for structure and completeness.
- Canonical URL construction: unit test for edge cases (trailing slash, locale prefix).

### Module: Forms
**Focus:** Form submission, validation, storage, spam protection.
**Target:** Medium-High. Forms are a direct attack surface.
- Submission with valid data: integration test.
- Submission with invalid/missing fields: unit test for validation schema; integration test for rejection.
- Honeypot field: unit test verifies spam detection.
- Submission storage: integration test verifies record created.
- Security: test that script injection in text fields is sanitized.

### Module: User Profile
**Focus:** Profile read/write, avatar upload, data ownership.
**Target:** Medium-High.
- Profile update: integration test.
- A user cannot update another user's profile: security test (authorization check).
- Avatar upload: reuses Media Library validation tests.

### Future: Commerce Modules (Commerce, Orders, Payments)
**Target:** High. Financial logic requires thorough testing.
When implemented, must include:
- Price calculation: unit tests covering promotions, variants, edge cases.
- Order state machine: unit tests for every valid and invalid transition.
- Payment webhook: integration test for valid, invalid, and duplicate webhooks.
- Client-supplied price rejection: security test (server must ignore client-sent price).
- Inventory decrement on order: integration test.

### Future: Booking Module
**Target:** Medium-High.
When implemented, must include:
- Availability calculation: unit tests covering overlaps, edge cases.
- Booking creation: integration test.
- Double-booking prevention: integration test (concurrent booking race condition).
- Cancellation within/outside window: unit test for business rule; integration test for persistence.

---

## 5. Test File Conventions

- Test files sit next to the file they test: `booking-service.ts` → `booking-service.test.ts`.
- E2E tests live in a dedicated `/e2e` directory at the project root.
- Test file names describe the subject: `booking-service.test.ts`, not `test1.ts`.
- Each test has a descriptive name: `should reject a booking past the cancellation window`.
- Arrange-Act-Assert structure in every test.
- No test depends on another test's side effects. Tests are independent and can run in any order.

---

## 6. CI Requirements

- All unit and integration tests run on every pull request. PR cannot merge if any test fails.
- E2E tests run on every push to `main`. Deployment is blocked if E2E fails.
- Type-checking (`tsc --noEmit`) runs on every pull request. Type errors block merge.
- `npm audit` runs on every pull request. Critical vulnerabilities block merge.

---

## 7. Test Data

- Use deterministic, seeded test data. Do not rely on random values in tests unless testing randomness itself.
- Use factories or builders to create test fixtures. Do not duplicate fixture setup across tests.
- Integration tests use a dedicated test database, isolated from development. It is reset between test runs.
- Never run tests against a production database.
