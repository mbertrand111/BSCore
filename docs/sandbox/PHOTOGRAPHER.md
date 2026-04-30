# Sandbox Photographer

A fictitious client (« Aurélie Lambert — Photographe de mariage ») used as
the reference visual harness for BSCore. The sandbox lets us validate the
modules (CMS, Media, SEO, Auth) end-to-end against a real-looking site
without setting up an actual customer project.

## Role

- Demo + acceptance harness — every module change should still render the
  five sandbox pages cleanly with seeded data.
- Reference for how a *real* client project should consume BSCore modules:
  pages stay in `src/app/(sandbox)/sandbox/photographer/*`, design code stays
  in `src/client/sandbox/photographer/*`, and modules stay untouched.
- Living example for the team — when a new module is added, document how the
  sandbox would (or would not) wire to it here.

## What is wired vs. hardcoded

The sandbox is intentionally a hybrid: page-level content comes from the CMS
and Media modules, but section-level visual copy (eyebrows, decorative
captions, stats blocks) stays in `content/site-content.ts`. The split is
documented per-component in JSDoc; the high-level summary:

| Section                        | Source             | Notes                                                   |
| ------------------------------ | ------------------ | ------------------------------------------------------- |
| Hero title / tagline / image   | CMS (hero block)   | Falls back to hardcoded copy if no block.               |
| About title + paragraphs       | CMS (text blocks)  | Sub-headlines + stats stay hardcoded (no block schema). |
| Portfolio gallery              | CMS (gallery block)| Filters hidden when CMS-driven (no taxonomy in V1).     |
| Services page header           | CMS title/excerpt  | Offer rows stay hardcoded (pricing schema not in CMS).  |
| Contact page header            | CMS title/excerpt  | Coordinates stay hardcoded (Settings module pending).   |
| Page metadata (title/desc/og)  | CMS + SEO module   | `getSeoMetadata` resolves entry → CMS fallback → null.  |
| Main image (Open Graph)        | Media module       | Resolved from `mainMediaAsset` via `getMediaPublicUrl`. |
| Featured tiles, intro, quote   | Hardcoded          | Marketing copy bound to design — not CMS-managed.       |

## Expected CMS pages

Every sandbox route reads its content from a published CMS page. The mapping
is enforced in `src/client/sandbox/photographer/content/site-content.ts`
under `photographerCmsSlugByRoute`.

| Sandbox route                          | CMS slug      | Status required |
| -------------------------------------- | ------------- | --------------- |
| `/sandbox/photographer`                | `accueil`     | `published`     |
| `/sandbox/photographer/portfolio`      | `portfolio`   | `published`     |
| `/sandbox/photographer/a-propos`       | `a-propos`    | `published`     |
| `/sandbox/photographer/services`       | `services`    | `published`     |
| `/sandbox/photographer/contact`        | `contact`     | `published`     |

A draft page (or a missing page) makes the sandbox fall back to the hardcoded
demo copy — the route never breaks. This is by design so the sandbox can be
demoed even on a fresh database.

## Modules required

- **CMS** — `getPublishedCmsPageBySlug`, `Block` types. Public surface only.
- **Media** — `getMediaAssetById`, `getMediaPublicUrl`. Used to resolve the
  page's main image and the gallery / hero block media.
- **SEO** — `getSeoMetadata`. CMS title/excerpt + main image are passed as
  fallback values when no SEO entry exists for the route.

The sandbox does NOT touch Auth, Audit, Admin, or any internal module
surface. If you find yourself reaching into `src/modules/<m>/data/` or
`src/modules/<m>/components/` from the sandbox, stop and add a public
re-export to that module's `index.ts` instead.

## How content reaches a page

1. The route's `page.tsx` is a server component.
2. It calls `loadSandboxPage(route)` (in `data/load-sandbox-page.ts`),
   which is wrapped in `React.cache()` so `generateMetadata` and the page
   default export share a single DB roundtrip per request.
3. `loadSandboxPage` calls the CMS module to fetch the page, then the Media
   module to resolve `mainMediaAsset`, the hero block image, and any
   gallery items in batch. Returns a `SandboxPageBundle` with everything
   pre-resolved.
4. The page component spreads the relevant fields onto the specialized
   sandbox components (Hero, AboutBody, PortfolioGrid, ServicesList,
   ContactPanel). Each component's CMS props are optional: when they're
   absent, the hardcoded demo copy is used.

## How to test from the admin

1. Sign in to `/admin` with one of the seeded users (`npm run seed:e2e`).
2. Open `/admin/cms` and confirm the five sandbox slugs above are present
   with status `published`. If they're missing, run `npm run seed:demo`.
3. Edit any of those pages — change the title or the hero block subtitle —
   and click `Enregistrer`.
4. Open the corresponding public route (e.g. `/sandbox/photographer`). The
   change should be reflected after the route revalidates (the action
   `revalidatePath('/${slug}')`s on save — sandbox routes share the same
   slug pattern at the leaf, so they pick up the revalidation).

To test the fallback: set a sandbox-mapped page to `draft`, hit the public
route — it should render the hardcoded demo copy without error.

## Local commands

```bash
npm run seed:e2e   # creates demo users (required for /admin login)
npm run seed:demo  # populates SEO + Media + CMS for the sandbox
npm run dev        # starts the dev server
```

After seed, browse:
- `/admin` — backoffice (login required)
- `/sandbox/photographer` — public sandbox, CMS-driven
- `/dev/modules` — module health checks

## Out of V1 scope (intentionally hardcoded)

- **Services list** (offer rows with bullets + price): would need a
  `services` block type or a Settings module — neither exists in V1.
- **Contact details** (email, phone, address, social): belongs to a future
  Settings module, not to the CMS (configuration ≠ content).
- **About stats trio** (120+ / 14 / 2018): would need a `stats` block type
  or Settings.
- **About sub-headlines** (« Philosophie », « Approche artistique »):
  would need a richer text block with heading levels.
- **Portfolio category filters** (« Cérémonies / Destinations / Détails »):
  the V1 CMS Gallery block carries no per-image taxonomy. Filters are hidden
  when CMS-driven; visible when falling back to hardcoded `portfolioTiles`.
- **Featured work tiles, intro section, quote strip**: design-bound editorial
  copy — not CMS-managed.
- **Newsletter / Reservations / Forms**: separate modules, not in V1.

When one of these "intentional" gaps is closed by a new module, update this
document and the corresponding component's JSDoc in the same PR.
