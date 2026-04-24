# ENGINEERING RULES — BSCore Development Standards

These rules apply to all code written in this project, across all layers and modules.
They are permanent. They are not suggestions.

---

## 1. Language and Typing

### TypeScript Strict Mode
- All code is written in TypeScript with `strict: true` in `tsconfig.json`.
- No `any` type. If a type is genuinely unknown, use `unknown` and narrow it explicitly.
- No type assertions (`as SomeType`) without a comment explaining why it is safe.
- No `@ts-ignore` or `@ts-expect-error` without a comment and a tracking note.
- Return types must be explicit on all exported functions.
- Prefer `interface` for object shapes that will be extended; `type` for unions, intersections, and aliases.

### Nullability
- Prefer explicit `null` over `undefined` for intentional absence of a value.
- Never use non-null assertion (`!`) unless the value is provably non-null at that point — and document why.

---

## 2. Architecture and Separation of Concerns

### Layer Discipline
- Each piece of code belongs to exactly one layer: Socle, Socle+, a Module, or Client-specific.
- A layer may only depend on the layer directly beneath it.
- When unsure which layer owns a piece of logic, consult `docs/BOUNDARIES.md`.

### HTTP / Domain / Data Separation
Every module enforces this internal structure:

- **HTTP layer (api/):** parses requests, validates input, shapes responses. Contains no business logic.
- **Domain layer (domain/):** implements business rules. Has no HTTP context, no database client.
- **Data layer (data/):** executes queries, maps database rows to domain objects. Has no business logic.

Calls flow in one direction only: HTTP → Domain → Data. Never reverse.

### No Business Logic in UI
- UI components display state and dispatch actions. They never compute business outcomes.
- All business rules live in the domain layer of the relevant module.

### No Direct Database Access from UI
- UI code never calls a database client directly.
- Data reaches the UI through API endpoints or server-side rendering functions that call the domain layer.

---

## 3. Module Rules

### No Direct Imports Between Modules
- A module never imports code from another module directly.
- If Module A depends on Module B, the dependency is declared in the module manifest and communication happens through Module B's registered public interface.
- For reactions and side-effects, use the event system (see `docs/ARCHITECTURE.md`).

### Module Public Interface
- Each module exposes a deliberate public interface (its `index` export).
- Internal module code (domain, data, helpers) is not exported outside the module.
- Other modules and client extensions call the public interface only.

### Module Independence
- Activating or deactivating a module must not break any other module that does not declare a dependency on it.
- A module's database migrations are owned by that module. They run through the Socle+ migration runner.

---

## 4. Input Validation

- All external inputs are validated at the HTTP layer before reaching the domain layer.
- Validation covers: presence, type, format, length, allowed values.
- Use a schema validation library (e.g., Zod). Never validate manually with ad-hoc conditions.
- Validation errors return structured, human-readable messages — never raw exception messages.
- The domain layer may perform additional business-rule validation (e.g., "booking must be in the future"), but it assumes types are already correct.
- Never trust: query parameters, request bodies, path parameters, headers, cookies, file names, uploaded file content.

---

## 5. Error Handling

- Errors propagate up through layers using typed error objects, not raw `throw new Error('string')`.
- The HTTP layer catches domain errors and maps them to appropriate HTTP status codes.
- Unhandled exceptions are caught by Socle's global error handler.
- Error responses always use the shape defined in Socle's error contract.
- Never expose stack traces, database errors, or internal state to the client.
- Log the full error internally (server-side); return only a safe, non-revealing message to the caller.

---

## 6. Secrets and Environment

- Secrets (API keys, database passwords, tokens) are stored in environment variables only.
- No secret is ever committed to the repository — not even in `.env.example` with real values.
- All required environment variables are listed in `.env.example` with placeholder values and a comment explaining each.
- Secrets are accessed through the configuration object Socle provides. No `process.env.SECRET` scattered in business code.
- Server-side secrets never reach the client bundle. Verify this at build time if possible.

---

## 7. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (modules, services) | kebab-case | `booking-service.ts` |
| React/Vue components | PascalCase | `BookingForm.tsx` |
| Variables, functions | camelCase | `getAvailableSlots` |
| Types, interfaces | PascalCase | `BookingRequest` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE_MB` |
| Database tables | snake_case | `booking_slots` |
| Events | domain.verb | `booking.confirmed` |
| CSS classes (if custom) | kebab-case | `admin-nav-item` |

---

## 8. Code Comments

- Write comments to explain **why**, never **what**.
- No multi-line comment blocks explaining obvious code.
- Comments are mandatory for: security trade-offs, non-obvious invariants, workarounds for known bugs, intentional deviations from the standard pattern.
- Outdated comments are worse than no comments. Remove them when the code changes.

---

## 9. File and Folder Structure

- One primary export per file (one class, one service function set, one component).
- No "utils.ts" catch-all files. Name files after what they contain.
- Keep files small. If a file exceeds ~300 lines, consider whether it has a single responsibility.
- Tests live next to the code they test: `booking-service.ts` → `booking-service.test.ts`.

---

## 10. Dependencies

- Do not add a new dependency without evaluating: maintenance status, bundle impact, license, security history.
- Prefer well-maintained, narrowly-scoped packages over large frameworks for specific tasks.
- Never add a dependency to solve a problem solvable in 10 lines of straightforward code.
- Lock dependency versions in `package.json` (exact versions for production dependencies).
- Review `npm audit` output before shipping. Critical vulnerabilities block shipping.

---

## 11. Progressive Development

- Build features in vertical slices: one complete, tested path from HTTP to DB before expanding.
- Do not write UI for a feature before the domain logic exists.
- Do not write the domain logic before knowing the data contract.
- Do not create abstractions speculatively. Extract when the third case appears, not before.

---

## 12. Documentation Updates

- When architecture changes (new module, new layer responsibility, new boundary), update the relevant `/docs` files in the same PR.
- When a module's public interface changes, update the module's registration index and any relevant documentation.
- `CLAUDE.md` and `docs/ENGINEERING_RULES.md` are reviewed at the start of every significant feature cycle.

---

## 13. Git Discipline

- One logical change per commit. No "fix everything" mega-commits.
- Commit messages follow Conventional Commits: `type(scope): short description`.
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `security`.
- No commits with broken tests, failing type-checks, or lint errors.
- Do not commit `.env` files, generated files, or editor configuration (use `.gitignore`).
