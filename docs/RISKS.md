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
| — | *No risks registered yet.* | — | — | — | — | — | — |

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
