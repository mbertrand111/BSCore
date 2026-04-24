# SEO RULES — BSCore

## 1. Scope

These rules apply to all public-facing pages. They define the minimum SEO implementation required before a public page is considered production-ready.

Admin interfaces, authenticated pages, and API endpoints are excluded.

---

## 2. Semantic HTML

- Use the correct HTML element for the correct semantic role. Never use a `<div>` when a semantic element exists.
- Every page has exactly one `<h1>`. It contains the primary topic of the page.
- Heading hierarchy is logical: `<h1>` → `<h2>` → `<h3>`. Do not skip levels for styling purposes.
- Navigation uses `<nav>`. Main content uses `<main>`. Footer uses `<footer>`. Aside content uses `<aside>`.
- Lists use `<ul>`, `<ol>`, `<li>`. Never simulate lists with line breaks or divs.
- Use `<article>` for independently distributable content (blog post, product card). Use `<section>` for thematic groupings within a page.
- Use `<time datetime="...">` for dates and times.
- Use `<figure>` and `<figcaption>` for images with captions.

---

## 3. Page Metadata

Every public page must have:

- **`<title>`:** Unique per page, descriptive, under 60 characters. Format: `Page Name — Site Name`.
- **`<meta name="description">`:** Unique per page, summarizes the page content, 120–160 characters. Does not duplicate the title.
- Both are managed through the SEO module. Content managers set them per page; sensible defaults are generated from page titles and content when not manually set.

Pages that must not be indexed:
- **`<meta name="robots" content="noindex">`** on: search results pages, pagination beyond page 1 (or use canonical), thank-you pages, error pages, duplicate content.

---

## 4. Open Graph and Social Metadata

Every public page that could be shared on social media must include:

```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
<meta property="og:type" content="website" />  <!-- or "article" for blog posts -->
<meta property="og:site_name" content="..." />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />
```

OG image requirements:
- Minimum 1200×630px.
- Hosted on the same domain or a trusted CDN.
- Alt text provided via `<meta name="twitter:image:alt">`.

---

## 5. Canonical URLs

- Every public page has a `<link rel="canonical" href="..." />` tag pointing to its canonical URL.
- Canonical URL is always the preferred, non-duplicate version of the page.
- Use canonical tags to handle: www vs non-www, trailing slash vs no trailing slash, paginated versions, filtered/sorted query strings.
- The canonical URL is always absolute (includes protocol and domain).
- Self-referencing canonicals are correct and expected on canonical pages.

---

## 6. Clean URLs

- URLs use lowercase letters, hyphens as word separators, and no special characters.
- No query parameters in canonical URLs for content pages. Slugs are path-based: `/blog/my-post-title`, not `/blog?id=42`.
- No redundant URL segments: `/services/` not `/pages/services/page/`.
- URL structure reflects content hierarchy: `/products/category/product-name`.
- When a page URL changes, implement a 301 redirect from the old URL to the new one. Broken internal links are a SEO and UX failure.
- Avoid URL parameters for content differentiation if a clean path can be used instead.

---

## 7. XML Sitemap

- The SEO module generates an XML sitemap automatically at `/sitemap.xml`.
- The sitemap includes: all public CMS pages, all published blog posts, all public-facing module pages (products, events, etc.).
- The sitemap excludes: admin pages, authenticated pages, noindex pages, error pages, paginated pages beyond page 1.
- The sitemap is submitted to Google Search Console and Bing Webmaster Tools after launch.
- `<lastmod>` is set to the content's last modified date where available.
- For large sites (>10,000 URLs), use a sitemap index and split into multiple sitemaps.
- The sitemap URL is referenced in `robots.txt`.

---

## 8. robots.txt

A `robots.txt` file is present at the root of every public site.

Minimum content:
```
User-agent: *
Disallow: /admin/
Disallow: /api/
Sitemap: https://example.com/sitemap.xml
```

Rules:
- Block admin routes from all crawlers.
- Block API routes from crawlers.
- Do not block CSS, JS, or font files — Googlebot renders pages and needs these assets.
- Do not use `robots.txt` as a security mechanism. It is advisory, not enforced.

---

## 9. Performance Awareness

Poor performance directly harms SEO rankings (Core Web Vitals). These are minimum requirements:

### Images
- All images have explicit `width` and `height` attributes to prevent layout shift (CLS).
- Use modern formats (WebP, AVIF) with fallbacks.
- Lazy-load images below the fold: `loading="lazy"`.
- Never lazy-load the largest above-the-fold image (LCP candidate).
- Serve appropriately sized images — do not serve a 4000px image for a 400px display slot.

### Scripts and Styles
- Eliminate render-blocking scripts in the `<head>`. Use `defer` or `async` for non-critical scripts.
- Critical CSS is inlined or loaded without blocking render.
- Third-party scripts (analytics, chat widgets) are loaded asynchronously and must not delay the main page.

### Core Web Vitals targets
These are targets, not hard blockers — but any page scoring below them should be flagged:
- LCP (Largest Contentful Paint): < 2.5s
- INP (Interaction to Next Paint): < 200ms
- CLS (Cumulative Layout Shift): < 0.1

---

## 10. Structured Data (Schema.org)

Use JSON-LD structured data where it adds crawler value. It is not required on every page.

Apply when:
- **Article / Blog post:** `Article` or `BlogPosting` schema.
- **Product page:** `Product` schema with `Offer`.
- **Event:** `Event` schema.
- **FAQ page:** `FAQPage` schema.
- **Local business:** `LocalBusiness` schema on the contact/about page.
- **Breadcrumbs:** `BreadcrumbList` schema on pages with navigational breadcrumbs.

Rules:
- Structured data must accurately reflect visible page content. Never include data not shown to the user.
- Validate structured data with Google's Rich Results Test before shipping.
- When the SEO module is active, structured data is injected through the module's registration, not scattered in components.

---

## 11. Crawlability

- Critical content must be in the HTML source, not loaded exclusively via JavaScript after page render.
- For JS-rendered frameworks (React, Vue, Next.js), use SSR or SSG for public content pages. CSR-only pages are not acceptable for content that must be indexed.
- Internal links use `<a href="...">` elements. Never rely solely on JavaScript `onClick` navigation for indexed pages.
- Pagination uses `<a>` links, not JavaScript. Link to the next/previous page.
- Infinite scroll must provide a paginated fallback for crawlers.
- Test crawlability using Google Search Console's URL Inspection tool after launch.

---

## 12. Internationalisation (when i18n module is active)

- Use `hreflang` tags to declare language and regional targeting.
- Each language version has its own canonical URL.
- The default language URL (e.g., `/en/`) is the canonical. Do not serve the same content at both `/` and `/en/` without a canonical or redirect.
- `hreflang` tags reference all language variants, including the page itself (`x-default` for the fallback).

---

## 13. What NOT to Do

- Do not hide content from users but show it to crawlers (cloaking). This is a manual penalty risk.
- Do not stuff keywords into titles, descriptions, or headings.
- Do not generate thousands of thin, near-duplicate pages automatically.
- Do not block CSS and JS from Googlebot.
- Do not redirect crawlers to different pages than users.
- Do not use `noindex` on pages you want indexed (obvious, but happens during development and forgotten).
