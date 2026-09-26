# SEO current state — 2026-09-26

Baseline: production `https://www.thivelab.com`, before the THIVELAB visual redesign. Repository HEAD: `24559b714524f8d366549e80d7963341190eb2d8`. The sample response fixture is `docs/seo/baseline-pages.json`.

## URL and response policy

- The default Korean locale has no `/ko` prefix. English uses `/en`. `src/proxy.ts` implements the rewrite and redirect; `src/i18n/path.ts` constructs localized links.
- Existing content URLs are `/blog/[slug]`, `/engineer/[slug]`, `/category/[cat]`, `/tag/[tag]`, `/series/[id]`; lists remain at their current paths. The apex domain redirects to `www` (301). The sampled `www` pages responded 200.
- The home canonical is `https://www.thivelab.com` without a trailing slash; English home is `/en`. Article and guide canonicals use the existing self URL. No route migration is planned.
- Search `/search?q=jwt` responded 200 with `noindex, follow`; its canonical and OG URL currently point to the home page. This is a preexisting condition, not a redesign change.
- Sampled category `AI & 자동화` returned a canonical with a literal `&` while its request/sitemap URL encoded it as `%26`. Preserve this behavior during the visual work; evaluate separately.

## Metadata and structured data

- `src/i18n/metadata.ts` produces locale aware title, description, canonical, hreflang, Open Graph and Twitter Card values. `NEXT_PUBLIC_SITE_URL` defaults to `https://www.thivelab.com`.
- `src/app/[locale]/layout.tsx` sets the `%s | Nodelog` title template, global Open Graph metadata, and JSON-LD `WebSite` plus `Organization` with name `Nodelog`. It retains GA4 `G-WL5W341ZFQ`, Vercel Analytics, AdSense and an RSS link.
- Article detail metadata and JSON-LD live in `src/app/[locale]/blog/[slug]/page.tsx`: self canonical and OG URL, conditional noindex, `Article` or `TechArticle`, plus `BreadcrumbList`. The article title, dates, author, publisher and mainEntityOfPage values are existing SEO assets.
- Engineer guides emit `TechArticle`, `BreadcrumbList`, and `HowTo` where applicable. Series pages emit breadcrumbs and item lists. Category pages emit `CollectionPage`.
- The sampled home title was `Nodelog — IT·개발·보안 테크 미디어`; the sampled article title ended `| Nodelog`. These are recorded in the fixture and are not subject to bulk replacement.

## Discovery feeds

- `src/app/sitemap.ts` serves `/sitemap.xml`, dynamically including static pages, six category pages, published indexable posts, published guides and qualifying series, with Korean/English alternates. The live prechange snapshot had **571 URL entries**, 405,368 bytes, SHA-256 `f932b82b125c44c903df68f8eeb208af93f04ae1fa1414416c85b76fb4beefb7`.
- `src/app/robots.ts` serves `/robots.txt`: default allow, selected utility/junk paths disallowed, bot specific rules, and the existing sitemap URL. Do not alter this policy in the redesign.
- `src/app/rss/route.ts` serves `/rss` for the latest 50 published posts. Keep feed paths and item URLs.

## Baseline sample

The fixture captures status, final URL, title, description, robots, canonical, OG URL, Twitter Card and schema types for: Korean and English home, one published article, one category, one series, one engineer guide, search, tags and about. It records schema identity fields without copying comment or reader data. Run the regression script against the same fixture after each deployment.

## Protected values

Preserve existing slugs, routes, article canonical and OG URL, index/noindex rules, sitemap membership, RSS item URLs, article schema core, breadcrumb schema, and established internal link destinations. Do not create `/nodelog/...` routes or redirects for existing content.
