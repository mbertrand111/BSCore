# client — Project-Specific Code

This directory contains everything unique to this client project.
It is the only layer that changes between projects. Nothing here
is ever merged back to the base repository.

**Contains:**
- `pages/` — project-specific page sections and templates
- `components/` — client-specific UI components
- `extensions/` — module extensions via published extension points
- `integrations/` — third-party integrations unique to this client
- `config/` — client-specific config overrides (theme, content)

**Must NOT contain:** modifications to module files (use extension points),
reusable generic logic (promote to a module or shared/ if needed elsewhere).

See: `docs/BOUNDARIES.md`
