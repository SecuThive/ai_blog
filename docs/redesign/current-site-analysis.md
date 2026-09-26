# Current site analysis

Inspected 2026-09-26 at HEAD `24559b714524f8d366549e80d7963341190eb2d8`. SEO response details: [current-state](../seo/current-state.md).

## Architecture and routes

| Area | Current implementation | Decision |
| --- | --- | --- |
| Framework/routing | Next.js 16.2.7 App Router under `src/app/[locale]`; `src/proxy.ts` keeps Korean unprefixed and English `/en` | KEEP |
| CMS/database | Supabase `posts` and `engineer_guides`; publishing and revalidation APIs | KEEP |
| Article rendering | `blog/[slug]` server page with article client features | KEEP |
| Main routes | `/`, `/about`, `/archive`, `/author`, `/blog`, `/bookmarks`, `/category/[cat]`, `/contact`, `/curated`, `/engineer`, `/engineer/[slug]`, `/faq`, `/policy`, `/privacy`, `/terms`, `/recommend`, `/search`, `/security`, `/series`, `/series/[id]`, `/subscribe`, `/tag/[tag]`, `/tags`, `/trending` | KEEP |
| Metadata | Shared `pageMetadata`, layout defaults and route specific `generateMetadata` | KEEP; home wording CAUTION |
| Sitemap/robots/RSS | `src/app/sitemap.ts`, `robots.ts`, `rss/route.ts` | KEEP |
| Search | Header modal, keyboard shortcut, `/search` and Supabase backed `/api/search` | KEEP |
| Categories/tags | Six categories in `src/i18n/categories.ts`; tags and `series:` tags on posts | KEEP |
| Analytics | GA4, Vercel Analytics; custom outbound click event helper | KEEP; add CTA events |
| Authentication | No blog login/profile; bookmarks are client side | Do not invent account links |
| CIPHER | Home promotion and AI category card point to `https://game.thivelab.com/` | CONNECT |

## NODELOG brand placement

The brand is visible in `Header.tsx`, `Footer.tsx`, home hero and launch banner, `ko.json`/`en.json`, layout metadata and JSON-LD, article publisher/schema, About and editorial/legal content. Preserve the metadata and article publisher in this phase. Use `NODELOG by THIVELAB` in new visible navigation and home copy.

## Existing content and navigation

The current header has a single navigation row: home, AI, trends, development, reviews, series, engineer and security. Search, language, theme, subscribe and mobile menu are functional. Home contains hero, MOA/CIPHER launch banner, Daily Briefing, engineer guides, reading lanes, latest posts, series, editorial quote and newsletter. Existing article exposure must remain substantial.

## Risks and opportunities

The route, locale, canonical, sitemap, RSS and schema code form the SEO boundary. Replacing article URLs or bulk changing titles would put indexed assets at risk. A separate global product row, visible parent brand, expanded product section and CIPHER promotion can improve discovery without touching that boundary. The preexisting search canonical and category encoding discrepancy deserve separate investigation; neither is a prerequisite for the UI redesign.

## Expected files by phase

| Phase | Files | Risk |
| --- | --- | --- |
| 0 baseline | `docs/seo/*`, `docs/redesign/*`, regression script | SAFE |
| 1 header | `src/components/Header.tsx`, `src/app/globals.css` | SAFE with mobile verification |
| 2 hero/products | `src/app/[locale]/page.tsx`, `src/app/globals.css` | SAFE with content/CTA verification |
| 3 content placement | `src/app/[locale]/page.tsx` | CAUTION: preserve existing article volume |
| 4 CIPHER links | Relevant article UI and verified game destination only | CAUTION |
| 5 schema/site name | `layout.tsx`, metadata and article pages | HIGH RISK; excluded |
| 6 analytics | `src/lib/analytics.ts`, CTA components | SAFE |
| 7 performance | CSS/asset adjustments after measurements | CAUTION |
| 8 regression | `scripts/seo-regression.mjs` and fixture | SAFE |

No files are classified REMOVE. Existing functions are KEEP, visible navigation and product presentation IMPROVE, and verified cross-service destinations CONNECT. A legacy project card may later be DEPRECATE only after its replacement is verified.
