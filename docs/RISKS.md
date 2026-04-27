# RISKS — Residual Risk Register

## Purpose

This file tracks **accepted or residual security and architectural risks** — situations where a known risk exists but has been consciously accepted, partially mitigated, or deferred.

This is NOT a TODO list or a bug tracker. It captures only risks that:
- have been identified and evaluated
- cannot be fully resolved right now (technical constraint, scope, timing)
- require explicit acknowledgement before the affected feature ships

Normal development tasks belong in the issue tracker. A risk belongs here when a security rule or architectural rule in `/docs` could not be fully satisfied and the gap must be tracked.

---

## How to Use

When a quality report identifies a remaining risk (`⚠️` or `❌`), add an entry below.
When a risk is resolved, mark its status `Resolved` and record the date — do not delete the entry.

---

## Severity Scale

| Level | Meaning |
|---|---|
| Critical | Exploitable with significant impact. Must be resolved before shipping. |
| High | Real exposure with meaningful impact. Resolve in the current sprint. |
| Medium | Limited exposure or low-probability path. Resolve before next release. |
| Low | Minimal real-world impact. Address when convenient. |

---

## Risk Register

| ID | Description | Layer / Module | Severity | Mitigation in place | Status | Identified | Owner |
|---|---|---|---|---|---|---|---|
| RISK-001 | `user_roles.user_id` has no FK to `auth.users` — deleting a Supabase user may leave an orphan row | Socle+ / auth | Low | `getUser()` validates the Supabase user before role lookup; orphan rows are unreachable at runtime | Accepted | 2026-04-27 | — |

---

### RISK-001 — Missing FK: `user_roles.user_id` → `auth.users`

| Field | Value |
|---|---|
| **ID** | RISK-001 |
| **Description** | `user_roles.user_id` does not have a foreign key constraint to Supabase's `auth.users(id)`. The constraint was deferred because the Supabase `auth` schema is not guaranteed to be present in all test environments (plain PostgreSQL test DB). |
| **Affected layer / module** | Socle+ / auth |
| **Severity** | Low |
| **Mitigation in place** | `authMiddleware` calls `supabase.auth.getUser()` before querying `user_roles`. If the Supabase user has been deleted, `getUser()` returns an error and the role lookup never executes. The orphan row is therefore unreachable through the normal authentication path. |
| **Remaining exposure** | A deleted Supabase user leaves a stale row in `user_roles`. The row consumes negligible storage and cannot be used to gain access, but it is not cleaned up automatically. |
| **Resolution plan** | Add a follow-up migration that executes `ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` once integration tests confirm a Supabase-backed test database is available. |
| **Status** | Accepted |
| **Date identified** | 2026-04-27 |
| **Owner** | — |

---

## Entry Template

Copy this block when adding a new risk:

```markdown
### RISK-XXX — [Short title]

| Field | Value |
|---|---|
| **ID** | RISK-XXX |
| **Description** | What the risk is and why it exists. |
| **Affected layer / module** | e.g. Socle+, Module: Forms, Client: acme |
| **Severity** | Critical / High / Medium / Low |
| **Mitigation in place** | What is already reducing the risk. |
| **Remaining exposure** | What is still unprotected and why. |
| **Resolution plan** | What needs to happen to close this risk. |
| **Status** | Open / In progress / Resolved |
| **Date identified** | YYYY-MM-DD |
| **Owner** | Name or role responsible for resolution |
```
