# Phased change plan (no URL migration)

This is a visual and information architecture rollout. Every existing URL, slug, canonical, sitemap URL, RSS item URL, article schema identity and permalink remains in place. The word “migration” here refers only to releasing small UI changes.

| Phase | Scope | Gate and rollback |
| --- | --- | --- |
| 0 | Record repository architecture and live SEO baseline | Baseline fixture and documents reviewed; no code touched |
| 1 | Parent brand and global/local header, mobile menu | Build, search/nav smoke check, SEO sample comparison; revert header/CSS changes alone |
| 2 | Hero and five product states | Build, mobile layout and CTA targets, SEO sample comparison; revert home/CSS changes alone |
| 3 | Content placement and preserved latest/guide/series exposure | Compare article links/count and rendering; revert page arrangement alone |
| 4 | Verified relevant CIPHER connection | Confirm destination resolves and topic match; revert only CTA mapping |
| 5 | SEO/schema proposals | No HIGH RISK mutations in this release |
| 6 | CTA analytics | Check events without removing existing GA/Vercel hooks; revert event calls alone |
| 7 | Performance | Check bundle and responsive behavior; correct regressions only |
| 8 | Regression | Compare 200/status, final URL, canonical, robots, title, description, OG URL and schema for sampled routes; verify sitemap and RSS |

Do not create redirects from indexed routes. A future URL proposal requires a separate ADR, explicit approval, redirect map, crawl plan and monitoring plan.

## First SAFE release record

- Phase 1: global product row and NODELOG local row added; mobile menu retains categories, search, language, theme and subscription access.
- Phase 2: THIVELAB hero and five product states added; CIPHER and MOA point to verified 200 destinations. LABS and ENTERPRISE remain non-link preparing states.
- Phase 3: existing Daily Briefing, engineer guides, reading lanes, latest articles and series remain. Their article URL destinations and number of post slots were not reduced.
- Phase 4: a distinct static CIPHER demo section is live. Article-specific challenge links remain CAUTION until matching challenge URLs are verified.
- Phase 5: site-name, publisher and article schema edits remain excluded.
- Phase 6: `home_nodelog_click`, `home_cipher_click` and `product_card_click` are emitted alongside existing outbound tracking.
- Phase 7: no image, video or JavaScript package was added. Field CWV needs post-deployment observation.
- Phase 8: `scripts/seo-regression.py` compares the baseline sample and all 571 baseline sitemap URLs. An intentional future editorial deletion or metadata update requires reviewing and refreshing the fixture separately.
