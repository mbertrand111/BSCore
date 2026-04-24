# socle-plus — Extended Infrastructure

Activated per project when auth, database, and admin are required.
Inherits everything from Socle and adds the infrastructure layer above it.

**Contains:** authentication lifecycle, session management, RBAC engine,
database connection, migration runner, admin shell container, audit log service.

**Must NOT contain:** domain entities, module-specific logic, or client rules.

See: `docs/SOCLE_PLUS.md`
