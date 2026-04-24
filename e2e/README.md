# e2e — End-to-End Tests

Playwright tests run against the full running application.
These are the only tests not co-located with source.

**Structure:**
- `specs/` — test files organized by domain (auth, cms, blog, forms...)
- `fixtures/` — shared test data, page object models, DB seed helpers
- `helpers/` — shared utilities (login helper, navigation helper, etc.)

**Runner:** `npm run test:e2e`
**CI:** runs before deployment, blocks on failure.

See: `docs/TESTING_STRATEGY.md`
