# e2e — End-to-End Tests

Playwright tests run against the full running application.
These are the only tests not co-located with source.

**Structure:**
- `specs/` — test files organized by domain (auth, admin, health, smoke, …)
- `fixtures/` — shared test data, page object models, DB seed helpers
- `helpers/` — shared utilities (login helper in `auth.ts`, …)

**Runner:** `npm run test:e2e`
**CI:** runs before deployment, blocks on failure.

See: `docs/TESTING_STRATEGY.md`

---

## Test users (auth flow)

The auth E2E specs require three seeded users on the target Supabase project:

| Role       | Env email var            | Env password var            | `user_roles` row |
|------------|--------------------------|-----------------------------|------------------|
| super_admin | `E2E_SUPER_ADMIN_EMAIL` | `E2E_SUPER_ADMIN_PASSWORD`  | `role = 'super_admin'` |
| admin       | `E2E_ADMIN_EMAIL`       | `E2E_ADMIN_PASSWORD`        | `role = 'admin'`       |
| no role     | `E2E_USER_EMAIL`        | `E2E_USER_PASSWORD`         | *no row*               |

**Seed them once per environment:**

```bash
npm run seed:e2e
```

The script (`scripts/seed-e2e-users.ts`):
- creates the Supabase users if missing (`email_confirm: true`)
- updates passwords to match the current env values (handles rotation)
- upserts `user_roles` rows for the role-bearing users
- removes any stale `user_roles` row for the no-role user
- is idempotent — safe to re-run

It needs `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `DATABASE_URL` in addition to the six `E2E_*` vars above.

**Never commit real credentials.** Use throw-away accounts on a dedicated test Supabase project. CI sets these via secrets.

---

## Skip behavior

Tests that need real auth use `test.skip()` so the suite still runs in degraded environments:

- `SUPABASE_URL` / `SUPABASE_ANON_KEY` missing → admin-guard tests skip (the guard cannot execute without Supabase)
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` missing → all "logged-in" specs skip

Skips are visible in the Playwright report — they are not silent failures.

---

## Backlog — tests to add when the env supports them

These specs are deferred until `SUPABASE_*` + `DATABASE_URL` are wired in the test environment AND the migrations have run on the test DB. They are **not** in `specs/` yet — listed here so they don't get forgotten.

### SEO module — admin happy path

**Trigger condition:** Supabase + DB E2E env online; `npm run db:migrate` executed against the test DB; `npm run seed:e2e` executed.

**Target test** (`e2e/specs/seo/seo-create.spec.ts` when it lands):

> An authenticated **admin** logs in, navigates to `/admin/seo`, clicks "New entry", fills the form (`route: /e2e-test`, `title: ...`, `description: ...`), submits, lands back on `/admin/seo`, and sees `/e2e-test` in the DataTable.

Exercises in one shot: auth + module activation (registerAdminNav + nav visible) + Zod validation + Server Action + DB write + `revalidatePath` + redirect.

**Cleanup:** the test deletes its row directly in DB at `afterEach` (or uses a unique route per run to avoid collisions).

**Pre-requisite:** module SEO migration `20260429_0005_create_seo_entries.ts` applied — see `docs/SEO_RULES.md` "Deployment note".
