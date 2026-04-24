# socle — Core Infrastructure

Zero database dependencies. Present in every project.

**Contains:** config loader, typed error contract, logger interface,
security middleware pipeline, routing helpers, pure utilities.

**Must NOT contain:** database clients, session logic, auth middleware,
domain entities, or any module-level code.

See: `docs/SOCLE.md`
