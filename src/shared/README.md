# shared — Reusable Code with No Business Logic

**Contains:**
- `ui/primitives/` — atomic components: Button, Input, Badge, Icon
- `ui/patterns/` — composed components: DataTable, Modal, Toast, FormLayout
- `ui/admin/` — admin shell components: PageHeader, SectionCard, Breadcrumbs
- `ui/utils/` — class merging, accessibility helpers
- `types/` — shared TypeScript interfaces (pagination, API shapes)
- `constants/` — app-wide constants

**Must NOT contain:** business logic, domain knowledge, module imports,
Socle+ imports, or client-specific code.

See: `docs/REPOSITORY_STRUCTURE.md`
