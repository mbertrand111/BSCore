# config — Static Application Configuration

Committed to the repository. Applied at build time or application start.
Values here are constants — they never read from the database.

**Contains:**
- `app.config.ts` — site name, base URL, default locale
- `modules.config.ts` — module activation list for this project
- `routes.config.ts` — route prefix conventions
- `seo.config.ts` — global SEO fallback values
- `theme.config.ts` — design tokens and Tailwind extensions

**Dynamic settings** (site title, contact info, feature flags managed at runtime)
belong in the database, not here.

See: `docs/TECH_STACK.md` — Configuration Strategy
