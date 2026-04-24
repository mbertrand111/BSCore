# modules — Domain Modules

Each subdirectory is one independently activatable module.
Modules are the domain feature layer: CMS, Blog, Forms, Media, SEO, etc.

**Rules:**
- Modules never import each other directly.
- Declared dependencies communicate through public interfaces only.
- Each module owns its data, migrations, admin section, and events.
- A module is removable without breaking the base system.

See: `docs/MODULES.md`, `docs/BOUNDARIES.md`
