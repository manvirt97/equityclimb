# EquityClimb v16.4 — Discovery Studio (preview-only)

## Why this release
Current Canadian real-estate platforms encourage repeat visits with clear search filters, saved searches, simple return journeys and visually fast discovery. EquityClimb should borrow these **interaction patterns**, not copy product branding or unlicensed inventory.

## What this PR implements
- A personalized home-search studio in **Real Estate → Discover** when live listing feed access is unavailable. It replaces the passive empty-feed introduction with a usable city, budget, bedrooms and home-type search-plan builder.
- Three quick budget choices and a preview of the **actual EquityClimb ownership calculation**: estimated monthly ownership, upfront cash, minimum down payment, and an eligibility caution.
- Up to six user-owned saved search plans, with reopen/remove functions and duplicate handling. Plans are stored within the existing `S.ec16` data object and do **not** overwrite property shortlist entries, mortgage scenarios, budget information or account settings.
- Real external browsing links to REALTOR.ca and Zolo; **no suggestion that filters transfer** or that listing results are integrated.
- A compact Home shortcut showing saved search count, manually shortlisted home count, and a one-click return to the Real Estate Discover tab.
- Theme-token styling, responsive controls, keyboard focus styles, screen-reader status announcements, reduced-motion support.
- Versioned HTML/CSS/JS load order and service-worker cache bump so the installed PWA can fetch the new assets.

## Explicit exclusions / compliance
- No MLS feed, photos, property listing cards, sold prices, scraping, background checks or push/email alerts are added.
- Saved search plans are **not** provider alerts; users must apply filters on the external listing website.
- Cash figures are illustrative and reuse existing Decision Lab assumptions. They do not imply preapproval or eligibility.
- No new packages, analytics, advertisements, paywalls, external APIs or backend secret changes.

## Validation carried out
- The JavaScript source passed V8 parsing.
- Twelve direct execution and asset checks passed for initialization, save, deduplication, limit, remove, input constraints, navigation, persistence isolation, HTML, PWA cache, and styles.
- Added `tests/v16-4-engagement.test.mjs` to the existing `node --test` suite and added `ec-v16-4.js` to `npm run syntax`.

## Before merge / production release
1. Run `npm test && npm run syntax` in a real Node environment or CI.
2. Use Cloudflare branch preview on desktop and iPhone, test light/dark mode, home, Real Estate → Discover, Saved and Decision Lab, onboarding, returning from external providers and app installed as PWA.
3. Confirm in a test account that existing budgets, properties, shortcuts, profile and optional sync remain unchanged; check storage quota failures.
4. Check that no live property feed appears without approved licensing, and price filters on external sites are not misrepresented.
5. If review passes, approve/merge via normal release process. No automatic production deployment is part of this PR.

## Research sources
- REALTOR.ca App Store description: https://apps.apple.com/ca/app/realtor-ca-real-estate-homes/id408873309
- REALTOR.ca saved searches: https://www.realtor.ca/my-saved-searches
- Zolo mobile features: https://www.zolo.ca/mobile
- HouseSigma watched areas: https://housesigma.com/blog-en/faq/features/watched-area-setting-up-a-new-area/
