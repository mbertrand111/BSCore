# CLAUDE.md — BSCore Engineering Instructions

This file governs all Claude Code sessions working on this project.
Read it fully before writing any code.

---

## 1. Read Before Coding

Before writing code, always check the relevant documentation in `/docs`.
If the requested implementation conflicts with the documented architecture, security rules, or quality standards, stop and explain the conflict before coding.

Relevant files by context:

| Context | Read first |
|---|---|
| Any implementation | `docs/ENGINEERING_RULES.md` |
| Adding a module or layer | `docs/ARCHITECTURE.md`, `docs/BOUNDARIES.md` |
| Security-sensitive feature | `docs/SECURITY_RULES.md` |
| Admin or backoffice UI | `docs/UX_RULES.md` |
| Public-facing page | `docs/SEO_RULES.md` |
| Writing tests | `docs/TESTING_STRATEGY.md` |
| Post-implementation review | `docs/QUALITY_CHECKLIST.md` |

---

## 2. Architecture Rules (Non-Negotiable)

- Socle / Socle+ / Modules / Client-specific layers must stay strictly separated.
- No module imports another module directly. Declare dependencies explicitly.
- No business logic inside UI components.
- No direct database access from UI components.
- Client-specific code never modifies module files directly.
- If a requested change would violate a boundary, stop and propose a compliant alternative.

Full rules: `docs/ARCHITECTURE.md`, `docs/BOUNDARIES.md`.

---

## 3. Security Rules (Non-Negotiable)

- Never expose secrets, tokens, or internal stack traces in responses.
- Never trust unvalidated external input.
- Never bypass authentication or authorization middleware.
- If a security rule cannot be fully satisfied, flag it explicitly as a remaining risk.

Full rules: `docs/SECURITY_RULES.md`.

---

## 4. Code Quality

- TypeScript strict mode. No `any`. No type assertions without justification.
- Follow `docs/ENGINEERING_RULES.md` for all implementation decisions.
- No over-engineering: implement exactly what is requested, nothing more.
- No premature abstraction. Three similar lines beat a wrong abstraction.
- No dead code, no commented-out code, no TODO left without a tracking note.

---

## 5. Testing

- Write tests progressively during development, not after.
- Domain logic always has unit tests.
- Integration tests for repositories, services, and modules.
- E2E tests for critical user flows.
- Never skip tests to ship faster.

Full strategy: `docs/TESTING_STRATEGY.md`.

---

## 6. Quality Report (Required After Every Implementation)

After each implementation, provide a short quality report in this format:

```
## Quality Report

**Architecture:** [boundary respected / issue: ...]
**Security:** [no known risk / risk: ...]
**Tests:** [written / missing: ...]
**UX:** [states handled / missing: ...]
**SEO:** [n/a / handled / missing: ...]
**Remaining risks:** [none / list explicitly]
```

Do not skip this report. If a section is not applicable, mark it `n/a`.

---

## 7. When to Stop and Ask

Stop and ask before proceeding if:

- The request conflicts with a documented boundary.
- The request requires a security trade-off.
- The implementation would require changes to more than one layer simultaneously.
- The scope is ambiguous and two interpretations would lead to different architectures.

Do not make silent assumptions on architecture or security decisions.
